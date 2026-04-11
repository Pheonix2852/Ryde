import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const { name, email, clerk_id } = await request.json();

    if (!name || !email || !clerk_id) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const existingUser = await sql`
      SELECT id, name, email, clerk_id
      FROM users
      WHERE clerk_id = ${clerk_id}
      LIMIT 1
    `;

    if (existingUser.length > 0) {
      return Response.json({ data: existingUser[0] }, { status: 200 });
    }

    const response = await sql`
    INSERT INTO users(
        name,
        email,
        clerk_id
    )
    VALUES (
        ${name},
        ${email},
        ${clerk_id}
    )
  `;

    return Response.json({ data: response }, { status: 201 });
  } catch (error) {
    console.log(error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
