import { neon } from "@neondatabase/serverless";
import { schemaAddRaft } from "./zod/schmeas";
import { Trip } from "@/types/types";
import { User } from "@auth/core/types";

export async function fetchUsersFromDB() {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const result = await sql`
    SELECT * FROM users;
    `;
    return result as User[];
}
export async function fetchTrips(tripCurrent: boolean) {
    const sql = neon(`${process.env.DATABASE_URL}`);

    const result = await sql`
            SELECT 
            row.id,
            row.guest_name,
            rt.name as raft_type_name,
            row.unit_number,
            row.checked_out_by,
            row.departure_time,
            row.arrival_time                
        FROM rafts_on_water row
        JOIN raft_types rt ON row.raft_type_id = rt.id
        WHERE departure_time > NOW() - INTERVAL '24 hours'
        ${tripCurrent ?
            sql`AND row.arrival_time IS NULL` :
            sql`AND row.arrival_time IS NOT NULL`
        }
        ORDER BY row.departure_time DESC`;
    return result as Trip[];
}

export async function searchTrips(guestName:string|null, departureTime: any) {
    const sql = neon(`postgres://neondb_owner:npg_yw8RlxjHrn6J@ep-orange-art-a4ytdp0m-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
`);


    const result = await sql`
            SELECT 
            row.id,
            row.guest_name,
            rt.name as raft_type_name,
            row.unit_number,
            row.checked_out_by,
            row.departure_time,
            row.arrival_time                
        FROM rafts_on_water row
        JOIN raft_types rt ON row.raft_type_id = rt.id
        WHERE 
            LOWER(row.guest_name) LIKE LOWER(${ '%' + guestName + '%' })
            ${departureTime?
            sql` AND row.departure_time BETWEEN ${departureTime + ' 00:00:00.0000'} 
                                         AND ${departureTime + ' 23:59:59.9999'} `:
            sql` `}
        ORDER BY row.departure_time DESC`;
    return result as Trip[];
}

export async function addRaftToWaterDB(validatedFields: typeof schemaAddRaft._type, email: string | null | undefined) {
    const sql = neon(`${process.env.DATABASE_URL}`);

    const [result] = await sql`
            INSERT INTO rafts_on_water (
                guest_name,
                raft_type_id,
                unit_number,
                checked_out_by,
                departure_time
            )
            VALUES (
                ${validatedFields.guestName},
                (SELECT id FROM raft_types WHERE name = ${validatedFields.raftType}),
                ${validatedFields.unitNumber},
                    1,
                NOW()
                )
                RETURNING *;
                `;
                return [result]
                // (SELECT id FROM users WHERE email = ${email}),
            }
            
            export async function removeRaftFromWater(raftOnWaterId: number, email: string | null | undefined) {
                const sql = neon(`${process.env.DATABASE_URL}`);
    const [result] = await sql`
        UPDATE rafts_on_water 
        SET arrival_time = NOW(),
            checked_in_by = (SELECT id FROM users WHERE email = ${email})
        WHERE id = ${raftOnWaterId}
        RETURNING *;
        `;
    return [result];
}

export async function toggleAdminDB(email: string) {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const [result] = await sql`
        UPDATE users 
        SET admin = NOT admin 
        WHERE email = ${email}
        RETURNING *;
    `;
    return [result];
}

export async function toggleEmployeeDB(email: string) {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const [result] = await sql`
        UPDATE users 
        SET employee = NOT employee 
        WHERE email = ${email}
        RETURNING *;
    `;
    return [result];
}

export async function searchTripsDB(guestName: string | string, departureTime: Date | string) {
    console.log(departureTime);
    // Adjust departure time by subtracting 6 hours
    const adjustedTime = new Date(departureTime);
    // adjustedTime.setHours(adjustedTime.getHours() - Number(process.env.OFFSET || 0));
    // Calculate time window (24 hours from adjusted time)
    const endTime = new Date(adjustedTime);

    endTime.setHours(endTime.getHours() + 24);
    const sql = neon(`${process.env.DATABASE_URL}`);

    const result = await sql`
            SELECT 
            row.id,
            row.guest_name,
            rt.name as raft_type_name,
            row.unit_number,
            row.checked_out_by,
            row.departure_time,
            row.arrival_time                
        FROM rafts_on_water row
        JOIN raft_types rt ON row.raft_type_id = rt.id
        WHERE 
            LOWER(row.guest_name) LIKE LOWER(${'%' + guestName + '%'})
            AND row.departure_time BETWEEN ${adjustedTime} AND ${endTime}
        ORDER BY row.departure_time DESC`;
    return result as Trip[];
}
