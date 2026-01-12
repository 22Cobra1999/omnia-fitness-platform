SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE (table_name = 'user_profiles' AND column_name = 'credits')
   OR (table_name = 'credit_transactions')
