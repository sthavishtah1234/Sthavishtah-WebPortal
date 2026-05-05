-- Create sample subscription pages
INSERT INTO subscription_pages (id, slug, title, subtitle, hero_image_url, introduction_title, introduction_content, status, created_at, updated_at) VALUES
(
  gen_random_uuid(),
  'yoga-programs',
  'Yoga Programs',
  'Transform your mind, body, and spirit through ancient practices',
  '/images/yoga-hero-bg.jpg',
  'Discover Inner Peace Through Yoga',
  'Our comprehensive yoga programs combine traditional asanas, breathing techniques, and meditation to help you achieve physical strength, mental clarity, and spiritual balance. Whether you''re a beginner or advanced practitioner, our expert instructors will guide you on your journey to wellness.',
  'published',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'fitness-training',
  'Fitness Training',
  'Build strength, endurance, and confidence',
  '/images/fitness-hero-bg.jpg',
  'Achieve Your Fitness Goals',
  'Our fitness training programs are designed to help you build strength, improve cardiovascular health, and boost your overall fitness level. With personalized workout plans and expert guidance, you''ll see results faster than ever before.',
  'published',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'wellness-packages',
  'Wellness Packages',
  'Holistic approach to health and well-being',
  '/images/wellness-bg.jpg',
  'Complete Wellness Solutions',
  'Our wellness packages combine nutrition guidance, stress management techniques, and lifestyle coaching to help you achieve optimal health. Take a holistic approach to your well-being with our comprehensive programs.',
  'published',
  NOW(),
  NOW()
);

-- Get the page IDs for linking
DO $$
DECLARE
    yoga_page_id UUID;
    fitness_page_id UUID;
    wellness_page_id UUID;
BEGIN
    -- Get page IDs
    SELECT id INTO yoga_page_id FROM subscription_pages WHERE slug = 'yoga-programs';
    SELECT id INTO fitness_page_id FROM subscription_pages WHERE slug = 'fitness-training';
    SELECT id INTO wellness_page_id FROM subscription_pages WHERE slug = 'wellness-packages';

    -- Create info cards for yoga programs
    INSERT INTO subscription_page_cards (id, page_id, card_type, title, value, icon, display_order) VALUES
    (gen_random_uuid(), yoga_page_id, 'info', 'Start Date', 'Flexible Start', 'calendar', 1),
    (gen_random_uuid(), yoga_page_id, 'info', 'Duration', '30-365 Days', 'clock', 2),
    (gen_random_uuid(), yoga_page_id, 'info', 'Price Range', 'From ₹2,999', 'star', 3),
    (gen_random_uuid(), yoga_page_id, 'info', 'Batches', '6 Available', 'users', 4);

    -- Create content sections for yoga programs
    INSERT INTO subscription_page_sections (id, page_id, title, content, display_order) VALUES
    (gen_random_uuid(), yoga_page_id, 'What You''ll Learn', '<ul><li>Traditional Hatha and Vinyasa yoga sequences</li><li>Pranayama (breathing techniques)</li><li>Meditation and mindfulness practices</li><li>Proper alignment and posture</li><li>Stress reduction techniques</li></ul>', 1),
    (gen_random_uuid(), yoga_page_id, 'Class Schedule', '<p>Our yoga classes are available at flexible timings to accommodate your schedule:</p><ul><li>Morning sessions: 6:00 AM - 8:00 AM</li><li>Evening sessions: 6:00 PM - 8:00 PM</li><li>Weekend workshops: 10:00 AM - 12:00 PM</li></ul>', 2),
    (gen_random_uuid(), yoga_page_id, 'Benefits & Results', '<p>Regular practice of yoga offers numerous benefits:</p><ul><li>Improved flexibility and strength</li><li>Better posture and balance</li><li>Reduced stress and anxiety</li><li>Enhanced mental clarity</li><li>Better sleep quality</li><li>Increased energy levels</li></ul>', 3);

    -- Link subscription plans to yoga page (assuming some subscription IDs exist)
    INSERT INTO subscription_page_plans (id, page_id, subscription_id, display_order)
    SELECT gen_random_uuid(), yoga_page_id, s.id, ROW_NUMBER() OVER (ORDER BY s.price)
    FROM subscriptions s 
    WHERE s.price > 0 
    LIMIT 3;

    -- Create similar content for fitness training
    INSERT INTO subscription_page_cards (id, page_id, card_type, title, value, icon, display_order) VALUES
    (gen_random_uuid(), fitness_page_id, 'info', 'Training Type', 'Strength & Cardio', 'star', 1),
    (gen_random_uuid(), fitness_page_id, 'info', 'Duration', '30-90 Days', 'clock', 2),
    (gen_random_uuid(), fitness_page_id, 'info', 'Equipment', 'Minimal Required', 'users', 3),
    (gen_random_uuid(), fitness_page_id, 'info', 'Difficulty', 'All Levels', 'calendar', 4);

    INSERT INTO subscription_page_sections (id, page_id, title, content, display_order) VALUES
    (gen_random_uuid(), fitness_page_id, 'Training Components', '<ul><li>Strength training with bodyweight and weights</li><li>Cardiovascular conditioning</li><li>Functional movement patterns</li><li>Flexibility and mobility work</li><li>Nutrition guidance</li></ul>', 1),
    (gen_random_uuid(), fitness_page_id, 'Workout Schedule', '<p>Structured training schedule designed for optimal results:</p><ul><li>3-4 training sessions per week</li><li>45-60 minutes per session</li><li>Progressive difficulty levels</li><li>Rest and recovery days included</li></ul>', 2);

    -- Create content for wellness packages
    INSERT INTO subscription_page_cards (id, page_id, card_type, title, value, icon, display_order) VALUES
    (gen_random_uuid(), wellness_page_id, 'info', 'Approach', 'Holistic Wellness', 'star', 1),
    (gen_random_uuid(), wellness_page_id, 'info', 'Support', '24/7 Guidance', 'users', 2),
    (gen_random_uuid(), wellness_page_id, 'info', 'Duration', 'Ongoing Support', 'clock', 3),
    (gen_random_uuid(), wellness_page_id, 'info', 'Focus Areas', 'Mind, Body, Spirit', 'calendar', 4);

    INSERT INTO subscription_page_sections (id, page_id, title, content, display_order) VALUES
    (gen_random_uuid(), wellness_page_id, 'Wellness Components', '<ul><li>Personalized nutrition planning</li><li>Stress management techniques</li><li>Sleep optimization strategies</li><li>Mindfulness and meditation</li><li>Lifestyle coaching</li></ul>', 1),
    (gen_random_uuid(), wellness_page_id, 'Support System', '<p>Comprehensive support for your wellness journey:</p><ul><li>Weekly one-on-one consultations</li><li>24/7 chat support</li><li>Progress tracking and adjustments</li><li>Community support groups</li></ul>', 2);

END $$;
