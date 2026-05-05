-- Team Members Table (stores all team member information)
CREATE TABLE IF NOT EXISTS team_members (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(255) NOT NULL,
  image_url TEXT,
  experience VARCHAR(100),
  bio TEXT,
  specialization VARCHAR(255),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Site Settings Table (stores toggle states for various sections)
CREATE TABLE IF NOT EXISTS site_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value BOOLEAN DEFAULT true,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default setting for Our Team section visibility
INSERT INTO site_settings (setting_key, setting_value, description)
VALUES ('show_our_team_section', true, 'Controls visibility of Our Team section on homepage')
ON CONFLICT (setting_key) DO NOTHING;

-- Insert default team members
INSERT INTO team_members (name, role, image_url, experience, bio, specialization, display_order) VALUES
('Priya Sharma', 'Senior Yoga Instructor', '/female-yoga-instructor-meditation-pose.jpg', '8+ years', 
 'Certified in Hatha and Vinyasa yoga with expertise in meditation and mindfulness practices. She brings years of experience in helping students find their inner peace.', 
 'Hatha Yoga, Meditation', 1),
('Arjun Patel', 'Meditation Guide', '/male-yoga-instructor-peaceful-expression.jpg', '6+ years',
 'Specialized in traditional meditation techniques and breathwork for stress relief. His calm presence helps students achieve deeper states of relaxation.',
 'Meditation, Breathwork', 2),
('Kavya Reddy', 'Breathwork Specialist', '/female-yoga-teacher-breathing-exercise.jpg', '5+ years',
 'Expert in pranayama and breathing techniques for healing and wellness transformation. She guides students through powerful breathing practices.',
 'Pranayama, Healing', 3),
('Ravi Kumar', 'Traditional Yoga Master', '/male-yoga-guru-traditional-pose.jpg', '12+ years',
 'Master of traditional yoga practices with deep knowledge of ancient yogic philosophy. His teachings connect students with authentic yoga traditions.',
 'Traditional Yoga, Philosophy', 4),
('Ananya Singh', 'Wellness Coach', '/female-wellness-instructor-smiling.jpg', '7+ years',
 'Holistic wellness coach focusing on lifestyle transformation and mind-body connection. She helps students integrate wellness into daily life.',
 'Wellness Coaching, Lifestyle', 5),
('Vikram Joshi', 'Asana Instructor', '/male-yoga-instructor-demonstration-pose.jpg', '9+ years',
 'Expert in advanced asana practice and alignment with focus on strength and flexibility. His precise instruction helps students master challenging poses.',
 'Asana Practice, Alignment', 6)
ON CONFLICT DO NOTHING;

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_team_members_active ON team_members(is_active);
CREATE INDEX IF NOT EXISTS idx_team_members_order ON team_members(display_order);
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(setting_key);
