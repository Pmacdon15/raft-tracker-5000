import { Booking, BookingWithTime, InvoiceData } from "@/types/types";

export async function fetchBookings(date: string): Promise<BookingWithTime[]> {
  const apiKey = process.env.API_KEY_CHECKFRONT;
  const apiSecret = process.env.API_SECRET_CHECKFRONT;
  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
  console.log("date: ", date);

  const dateObject = new Date(date);
  const formattedDate = dateObject.toISOString()

  const response = await fetch(
    `${process.env.CHECKFRONT_URL}/api/3.0/booking?start_date=${formattedDate}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
      },
      next: { revalidate: 900 }
    },
  );

  const data: any = await response.json();
  // console.log("Bookings", data)
  if (!data["booking/index"]) {
    console.log("No bookings found for the specified date.");
    return [];
  }

  const bookings = Object.values(data["booking/index"]) as Booking[];

  const bookingTimes = await Promise.all(
    bookings.map(async (booking: Booking) => {
      const invoiceResponse = await fetch(
        `${process.env.CHECKFRONT_URL}/api/3.0/booking/${booking.booking_id}/invoice`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${auth}`,
          },
          next: { revalidate: 900 }
        }
      );

      const invoiceData: InvoiceData = await invoiceResponse.json();
      // console.log("Invoice data: ", invoiceData)
      const html = invoiceData.booking.invoice.html;
      const timeRegex = /<i class='fa fa-clock-o'><\/i>\s*(.*?)\s*<\/td>/;
      const match = html.match(timeRegex);
      const time = match && match[1] ? match[1].trim() : 'Time not found';
      return { booking, time };
    })
  );

  const offsetHours = Number(process.env.OFFSET || 0);

  let targetHour = dateObject.getHours() - offsetHours;
  const targetMinute = dateObject.getMinutes();
  const targetTimeInMinutes = targetHour * 60 + targetMinute;

  const start = targetTimeInMinutes - 30;
  const end = targetTimeInMinutes + 30;

  const filteredBookings: BookingWithTime[] = bookingTimes
    .filter((booking) => {
      const bookingTime = convertTimeToMinutes(booking.time);
      return bookingTime >= start && bookingTime <= end;
    })
    .map((booking) => ({
      ...booking.booking,
      time: booking.time,
    }));

  // console.log("booking times:", bookingTimes.map((booking) => ({ code: booking.booking.code, time: booking.time })))
  // console.log("bookings within time range: ", filteredBookings)
  return filteredBookings;
}


function convertTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map((val) => parseInt(val.replace(' AM', '').replace(' PM', '')));
  let totalMinutes = hours * 60 + minutes;
  if (time.includes(' PM') && hours !== 12) {
    totalMinutes += 12 * 60;
  } else if (time.includes(' AM') && hours === 12) {
    totalMinutes -= 12 * 60;
  }
  return totalMinutes;
}