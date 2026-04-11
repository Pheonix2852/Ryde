import { Stripe } from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, amount } = body;

    if (!name || !email || !amount) {
      return Response.json(
        {
          error: "Please provide name, email, and amount",
        },
        { status: 400 },
      );
    }

    const amountInPaise = Math.round(Number(amount) * 100);
    if (!Number.isFinite(amountInPaise)) {
      return Response.json(
        { error: "Invalid amount" },
        {
          status: 400,
        },
      );
    }

    if (amountInPaise < 50) {
      return Response.json(
        {
          error: "Amount is too low. Minimum charge is Rs0.50.",
        },
        { status: 400 },
      );
    }

    const existingCustomer = await stripe.customers.list({ email, limit: 1 });
    const customer =
      existingCustomer.data[0] ||
      (await stripe.customers.create({ name, email }));

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInPaise,
      currency: "inr",
      customer: customer.id,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never",
      },
    });

    return Response.json(
      {
        paymentIntent,
        customer: customer.id,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error creating payment intent:", error);
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    return Response.json({ error: message }, { status: 500 });
  }
}
