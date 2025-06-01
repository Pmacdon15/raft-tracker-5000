'use server'
import { auth } from "@/auth";
import { addRaftToWaterDB, removeRaftFromWater } from "@/lib/utils/db";
import { schemaAddRaft, schemaRemoveRaft } from "@/lib/utils/zod/schmeas";
import { neon } from "@neondatabase/serverless";
import z from 'zod';




export async function addRaftToWater(formData: FormData) {
    const session = await auth();
    const email = session?.user.email;

    const validatedFields = schemaAddRaft.safeParse({
        guestName: formData.get("guest-name"),
        raftType: formData.get("raft-type"),
        unitNumber: Number(formData.get("unit-number")),
        lateCheckInTime: formData.get("late-check-in-time")
    });

    console.log("Late Check in Time: ", validatedFields.data?.lateCheckInTime, formData.get("late-check-in-time"))

    if (!validatedFields.success) throw new Error("Invalid form data");

    // If you need a Date object:
    let lateCheckInDate: Date | undefined = undefined;
    if (validatedFields.data.lateCheckInTime) {
        const [hours, minutes] = validatedFields.data.lateCheckInTime.split(':');
        lateCheckInDate = new Date();
        lateCheckInDate.setHours(Number(hours), Number(minutes), 0, 0);
    }
    try {
        const [result] = await addRaftToWaterDB(validatedFields.data, email)

        if (!result) throw new Error('Failed to add raft to water');

        return result;
    } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        throw new Error(errorMessage);
    }
}

export async function addRemoveRaftFromWater(raftOnWaterId: number) {
    const session = await auth();
    const email = session?.user.email;

    const validatedFields = schemaRemoveRaft.safeParse({ raftOnWaterId: raftOnWaterId });

    if (!validatedFields.success) throw new Error("Invalid data");

    try {
        const sql = neon(`${process.env.DATABASE_URL} `);
        const [result] = await removeRaftFromWater(validatedFields.data.raftOnWaterId, email)

        if (!result) throw new Error('Failed to mark raft as arrived');
        return result;
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(errorMessage);
    }
}