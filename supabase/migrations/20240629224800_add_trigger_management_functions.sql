-- Function to disable a trigger
CREATE OR REPLACE FUNCTION disable_trigger(
  trigger_name TEXT,
  table_name TEXT
) RETURNS VOID AS $$
BEGIN
  EXECUTE format('ALTER TABLE %I DISABLE TRIGGER %I', 
                table_name, 
                trigger_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to enable a trigger
CREATE OR REPLACE FUNCTION enable_trigger(
  trigger_name TEXT,
  table_name TEXT
) RETURNS VOID AS $$
BEGIN
  EXECUTE format('ALTER TABLE %I ENABLE TRIGGER %I', 
                table_name, 
                trigger_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
