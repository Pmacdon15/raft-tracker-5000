'use client'
import { useAddRaftToWater } from "@/mutations/mutations";
import MainContainer from "../containers/main-container";
import { useGetBookings } from "@/hooks/hooks";
import { useState } from 'react';
import { BookingData, GuestData, RaftOption } from "@/types/types";
import { boatOptions } from "@/lib/utils/rafts";
import Inputs from "./inputs";
// import { z } from "zod";

// export const schemaAddRaft = z.object({
//     guestName: z.string(),
//     raftType: z.string(),
//     unitNumber: z.number(),
//     lateCheckInTime: z.date(),
// });

export default function DepartureForm() {
    const [selectedGuest, setSelectedGuest] = useState<{ bookingId: number | null; name: string } | null>(null);
    const [raftType, setRaftType] = useState<RaftOption | null>(null);
    const [unitNumber, setUnitNumber] = useState('');
    const [date, setDate] = useState(new Date())
    // const [lateChkInTime, setLatCheckInTime] = useState<Date | null>(null)

    const { data, isLoading, isError, refetch } = useGetBookings(date);
    const { mutate, isPending } = useAddRaftToWater();

    const guests: GuestData[] = data
        ? Array.from(
            new Map(
                (data as BookingData[]).map((booking) => [
                    booking.customer_name, // key (unique by name)
                    {
                        name: booking.customer_name,
                        bookingId: booking.booking_id,
                        summary: booking.summary.replace(/Sit-on-top /i, ''),
                    }
                ])
            ).values()
        )
        : [];

    function onRefetch() {
        setDate(new Date)
        refetch();
    }

    return (
        <MainContainer>
            <h1 className="text-2xl">Show a guests departure </h1>
            <button className='border rounded-sm md:w-1/6 w-2/6 mx-auto hover:bg-gray-100' onClick={() => onRefetch()}>Refetch Bookings</button>
            {isLoading && <p>Loading bookings...</p>}
            {isError && <p className="text-red-500">Error loading bookings!</p>}
            <form
                action={(formData: FormData) => {
                    formData.append('booking-id', selectedGuest?.bookingId?.toString() || '');
                    formData.append('guest-name', selectedGuest?.name || '');
                    formData.append('raft-type', raftType?.value || '');
                    formData.append('unit-number', unitNumber);
                    // formData.append('late-check-in-time', lateChkInTime?.toISOString() || '');
                    console.log("late-check-in-time", formData.get("late-check-in-time"));

                    mutate(formData);
                    setSelectedGuest(null);
                    setRaftType(null);
                    setUnitNumber('');
                }}
                className="flex flex-col gap-2 "
            >
                <Inputs
                    isPending={isPending}
                    guests={guests}
                    boatOptions={boatOptions}
                    selectedGuest={selectedGuest}
                    setSelectedGuest={setSelectedGuest}
                    raftType={raftType}
                    setRaftType={setRaftType}
                    unitNumber={unitNumber}
                    setUnitNumber={setUnitNumber}
                // setLateCheckInTime={setLatCheckInTime}
                />
            </form>
        </MainContainer>
    );
}

