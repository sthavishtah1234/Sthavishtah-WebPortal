-- Fix the available_seats trigger to also handle DELETE operations
-- This ensures the stored available_seats column stays in sync when bookings are deleted

CREATE OR REPLACE FUNCTION update_available_seats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.is_paid = true THEN
    UPDATE event_tickets 
    SET available_seats = available_seats - 1 
    WHERE id = NEW.ticket_id AND available_seats > 0;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' AND OLD.is_paid = false AND NEW.is_paid = true THEN
    UPDATE event_tickets 
    SET available_seats = available_seats - 1 
    WHERE id = NEW.ticket_id AND available_seats > 0;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' AND OLD.is_paid = true THEN
    -- When a paid booking is deleted, increment available_seats back
    UPDATE event_tickets 
    SET available_seats = LEAST(available_seats + 1, total_seats)
    WHERE id = OLD.ticket_id;
    RETURN OLD;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger to include DELETE operations
DROP TRIGGER IF EXISTS trigger_update_seats ON ticket_bookings;
CREATE TRIGGER trigger_update_seats
AFTER INSERT OR UPDATE OR DELETE ON ticket_bookings
FOR EACH ROW
EXECUTE FUNCTION update_available_seats();

-- Also recalculate all available_seats right now to fix any existing drift
UPDATE event_tickets
SET available_seats = total_seats - COALESCE((
  SELECT COUNT(*) 
  FROM ticket_bookings 
  WHERE ticket_bookings.ticket_id = event_tickets.id 
  AND ticket_bookings.is_paid = true
), 0);
