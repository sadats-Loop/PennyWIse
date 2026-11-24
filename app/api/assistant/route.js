
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

function safeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function sanitizeContext(context = {}) {
  return {
    balance: safeNumber(context.balance),
    monthlyIncome: safeNumber(context.monthlyIncome),
    monthlyExpenses: safeNumber(context.monthlyExpenses),
    monthlySavings: safeNumber(context.monthlySavings),
    monthlyPocketMoney: safeNumber(context.monthlyPocketMoney),
    savingsRate: safeNumber(context.savingsRate),
    transactionCount: safeNumber(context.transactionCount),

    recentTransactions: Array.isArray(context.recentTransactions)
      ? context.recentTransactions.slice(0, 20).map((transaction) => ({
          title: String(
            transaction.title || transaction.name || "Transaction"
          ).slice(0, 100),
          amount: safeNumber(transaction.amount),
          category: String(transaction.category || "Other").slice(0, 50),
          date: String(transaction.date || "").slice(0, 30),
          type: String(transaction.type || "").slice(0, 30),
        }))
      : [],
  };
}

function jsonError(message, status = 500) {
  return Response.json(
    {
      success: false,
      error: message,
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

// Test endpoint
export async function GET() {
  return Response.json({
    success: true,
    message: "PennyWise Groq API is running.",
    configured: Boolean(process.env.GROQ_API_KEY),
    provider: "Groq",
    model: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
  });
}

export async function POST(request) {
  try {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return jsonError(
        "GROQ_API_KEY is missing. Add it to your .env.local file.",
        500
      );
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return jsonError("Invalid request body. Expected JSON.", 400);
    }

    const message = String(body.message || "").trim();

    if (!message) {
      return jsonError("Please enter a message.", 400);
    }

    if (message.length > 4000) {
      return jsonError("Your message is too long.", 400);
    }

    const financialContext = sanitizeContext(
      body.financialContext || {}
    );

    const history = Array.isArray(body.history)
      ? body.history.slice(-10).map((item) => ({
          role: item.role === "assistant" ? "assistant" : "user",
          content: String(item.content || "").slice(0, 2000),
        }))
      : [];

    const systemInstructions = `
You are PennyWise AI, a friendly, intelligent and practical personal finance assistant.

Your job is to help users understand their money, manage their monthly budget,
control spending and build better saving habits.

IMPORTANT RULES:

1. Use the supplied financial context when answering questions about money.
2. Never invent financial numbers, transactions, income, expenses or savings.
3. If information is missing, clearly say you do not have it.
4. Give practical recommendations based on the user's actual financial situation.
5. Keep answers clear, friendly and easy to understand.
6. Use BDT (৳) when discussing money.
7. Never claim to have changed budgets, transactions or account settings.
8. Never ask for passwords, API keys or sensitive account information.
9. Do not confuse monthly income with current wallet balance.
10. Be supportive and non-judgmental about spending habits.

FINANCIAL CONTEXT:

${JSON.stringify(financialContext, null, 2)}
`;

    const model =
      process.env.GROQ_MODEL || "openai/gpt-oss-20b";

    const groqResponse = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: systemInstructions,
          },
          ...history,
          {
            role: "user",
            content: message,
          },
        ],
        temperature: 0.6,
        max_completion_tokens: 1500,
      }),
      cache: "no-store",
    });

    const responseText = await groqResponse.text();

    let responseData;

    try {
      responseData = JSON.parse(responseText);
    } catch {
      console.error(
        "Groq returned invalid JSON:",
        responseText.slice(0, 500)
      );

      return jsonError(
        "The AI service returned an invalid response.",
        502
      );
    }

    if (!groqResponse.ok) {
      console.error("Groq API error:", responseData);

      return jsonError(
        responseData.error?.message ||
          `Groq request failed with status ${groqResponse.status}.`,
        groqResponse.status
      );
    }

    const reply =
      responseData.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      console.error("Groq returned no message:", responseData);

      return jsonError(
        "The AI could not generate a response. Please try again.",
        502
      );
    }

    return Response.json(
      {
        success: true,
        reply,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("PennyWise Groq API error:", error);

    return jsonError(
      "Something went wrong on the server. Please try again.",
      500
    );
  }
}
