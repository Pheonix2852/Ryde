import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      origin_address,
      destination_address,
      origin_latitude,
      origin_longitude,
      destination_latitude,
      destination_longitude,
      ride_time,
      fare_price,
      payment_status,
      driver_id,
      user_id,
    } = body;

    if (
      origin_address == null ||
      destination_address == null ||
      origin_latitude == null ||
      origin_longitude == null ||
      destination_latitude == null ||
      destination_longitude == null ||
      ride_time == null ||
      fare_price == null ||
      payment_status == null ||
      driver_id == null ||
      user_id == null
    ) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const sql = neon(`${process.env.DATABASE_URL}`);

    await sql`
      CREATE TABLE IF NOT EXISTS rides (
        ride_id SERIAL PRIMARY KEY,
        origin_address TEXT NOT NULL,
        destination_address TEXT NOT NULL,
        origin_latitude DOUBLE PRECISION NOT NULL,
        origin_longitude DOUBLE PRECISION NOT NULL,
        destination_latitude DOUBLE PRECISION NOT NULL,
        destination_longitude DOUBLE PRECISION NOT NULL,
        ride_time INTEGER NOT NULL,
        fare_price NUMERIC NOT NULL,
        payment_status VARCHAR(50) NOT NULL,
        driver_id INTEGER NOT NULL REFERENCES drivers(id),
        user_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    const response = await sql`
        INSERT INTO rides ( 
          origin_address, 
          destination_address, 
          origin_latitude, 
          origin_longitude, 
          destination_latitude, 
          destination_longitude, 
          ride_time, 
          fare_price, 
          payment_status, 
          driver_id, 
          user_id
        ) VALUES (
          ${origin_address},
          ${destination_address},
          ${Number(origin_latitude)},
          ${Number(origin_longitude)},
          ${Number(destination_latitude)},
          ${Number(destination_longitude)},
          ${Math.round(Number(ride_time))},
          ${Number(fare_price)},
          ${payment_status},
          ${Number(driver_id)},
          ${user_id}
        )
        RETURNING *;
        `;

    return Response.json({ data: response[0] }, { status: 201 });
  } catch (error) {
    console.error("Error inserting data into recent_rides:", error);
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    return Response.json({ error: message }, { status: 500 });
  }
}
