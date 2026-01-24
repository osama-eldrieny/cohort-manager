-- Add button_label column to email_templates table
ALTER TABLE email_templates ADD COLUMN button_label VARCHAR(255);

-- Update existing templates with button_label values
UPDATE email_templates SET button_label = 'Waiting list' WHERE name = 'Waiting list';
UPDATE email_templates SET button_label = 'Roles & Agreement' WHERE name = 'Roles & Agreement';
UPDATE email_templates SET button_label = 'Cohort Grouping Form' WHERE name = 'Cohort Grouping Form';
UPDATE email_templates SET button_label = 'Community Invitation' WHERE name = 'Community Invitation';
UPDATE email_templates SET button_label = 'Camp Feedback' WHERE name = 'Camp Feedback';
