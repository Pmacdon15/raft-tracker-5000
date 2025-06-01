import z from 'zod'

export const schemaAddRaft = z.object({
    guestName: z.string(),
    raftType: z.string(),
    unitNumber: z.number(),
    lateCheckInTime: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal("")), 
});

export const schemaRemoveRaft = z.object({
    raftOnWaterId: z.number(),
})