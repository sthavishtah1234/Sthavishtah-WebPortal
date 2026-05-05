-- Create a function to increment the seats_taken count for a batch
CREATE OR REPLACE FUNCTION increment_batch_seats(batch_id INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE subscription_batches
  SET seats_taken = seats_taken + 1
  WHERE id = batch_id;
END;
$$ LANGUAGE plpgsql;

-- Create a function to decrement the seats_taken count for a batch
CREATE OR REPLACE FUNCTION decrement_batch_seats(batch_id INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE subscription_batches
  SET seats_taken = GREATEST(0, seats_taken - 1)
  WHERE id = batch_id;
END;
$$ LANGUAGE plpgsql;
