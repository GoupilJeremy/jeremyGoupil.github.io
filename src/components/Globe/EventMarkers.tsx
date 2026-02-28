import type { HistoricalEvent } from "../../types";
import sampleEvents from "../../data/events/sample.json";
import EventMarker from "./EventMarker";

export default function EventMarkers() {
  const events = sampleEvents as HistoricalEvent[];

  return (
    <group>
      {events.map((event) => (
        <EventMarker key={event.id} event={event} />
      ))}
    </group>
  );
}
