-- Event Tickets System Database Tables
-- Run this in Supabase SQL Editor

-- Table for storing events
CREATE TABLE IF NOT EXISTS event_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name VARCHAR(255) NOT NULL,
  event_date DATE NOT NULL,
  event_time TIME NOT NULL,
  venue VARCHAR(500) NOT NULL,
  description TEXT,
  ticket_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_seats INTEGER NOT NULL DEFAULT 100,
  available_seats INTEGER NOT NULL DEFAULT 100,
  image_url VARCHAR(1000),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for storing ticket bookings
CREATE TABLE IF NOT EXISTS ticket_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES event_tickets(id) ON DELETE CASCADE,
  user_id VARCHAR(255), -- NULL for non-registered users
  booking_name VARCHAR(255) NOT NULL,
  booking_email VARCHAR(255) NOT NULL,
  booking_phone VARCHAR(20) NOT NULL,
  passkey VARCHAR(4), -- 4-digit passkey for non-registered users (NULL if registered)
  qr_code_data VARCHAR(500) UNIQUE NOT NULL, -- Unique string for QR verification
  payment_id VARCHAR(255),
  razorpay_order_id VARCHAR(255),
  razorpay_signature VARCHAR(500),
  is_paid BOOLEAN DEFAULT false,
  is_attended BOOLEAN DEFAULT false, -- For QR scan check-in
  attended_at TIMESTAMP WITH TIME ZONE, -- When they checked in
  booking_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_event_tickets_date ON event_tickets(event_date);
CREATE INDEX IF NOT EXISTS idx_event_tickets_active ON event_tickets(is_active);
CREATE INDEX IF NOT EXISTS idx_ticket_bookings_phone ON ticket_bookings(booking_phone);
CREATE INDEX IF NOT EXISTS idx_ticket_bookings_ticket_id ON ticket_bookings(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_bookings_qr_code ON ticket_bookings(qr_code_data);
CREATE INDEX IF NOT EXISTS idx_ticket_bookings_paid ON ticket_bookings(is_paid);

-- Function to automatically update available_seats when booking is made
CREATE OR REPLACE FUNCTION update_available_seats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.is_paid = true THEN
    UPDATE event_tickets 
    SET available_seats = available_seats - 1 
    WHERE id = NEW.ticket_id AND available_seats > 0;
  ELSIF TG_OP = 'UPDATE' AND OLD.is_paid = false AND NEW.is_paid = true THEN
    UPDATE event_tickets 
    SET available_seats = available_seats - 1 
    WHERE id = NEW.ticket_id AND available_seats > 0;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating seats
DROP TRIGGER IF EXISTS trigger_update_seats ON ticket_bookings;
CREATE TRIGGER trigger_update_seats
AFTER INSERT OR UPDATE ON ticket_bookings
FOR EACH ROW
EXECUTE FUNCTION update_available_seats();
