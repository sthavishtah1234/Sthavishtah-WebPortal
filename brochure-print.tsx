"use client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Leaf, Sun, Moon, CheckCircle, Calendar, Utensils, Dumbbell, Brain, Users, Heart, Wind } from "lucide-react"

export default function PrintableBrochure() {
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto mb-8 print:hidden">
        <Button onClick={handlePrint} className="bg-green-700 hover:bg-green-800">
          Print Brochure
        </Button>
      </div>

      {/* Page 1: Cover */}
      <div className="max-w-4xl mx-auto mb-16 page">
        <div className="bg-gradient-to-r from-green-800 to-green-700 text-white p-6 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center">
            <div className="bg-white/20 p-3 rounded-full mr-4">
              <Leaf className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">STHAVISHTAH</h1>
              <p className="text-sm tracking-widest text-green-100">YOGA AND WELLNESS</p>
            </div>
          </div>
          <Badge className="bg-white/20 text-white">Sessions from May 12, 2025</Badge>
        </div>

        <div className="border border-t-0 border-gray-200 rounded-b-xl p-8 bg-white">
          <div className="text-center mb-12">
            <div className="relative h-32 w-32 mx-auto mb-6">
              <div className="absolute inset-0 bg-green-100 rounded-full"></div>
              <Leaf className="h-full w-full text-green-700 relative z-10 p-6" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-green-800">BREATHE, BALANCE, BECOME</h2>
            <p className="text-xl text-green-700 mb-8">Your journey to holistic wellness begins here</p>
          </div>

          <div className="max-w-2xl mx-auto text-center mb-8">
            <p className="text-lg text-gray-700 leading-relaxed">
              Sthavishtah Yoga and Wellness invites you to embark on a transformative journey of self-discovery through
              ancient wisdom in a modern sanctuary. Our expert-guided sessions harmonize mind, body, and spirit in a
              serene community setting.
            </p>
          </div>
        </div>
      </div>

      {/* Page 2: Batches */}
      <div className="max-w-4xl mx-auto mb-16 page">
        <div className="border border-gray-200 rounded-xl p-8 bg-white">
          <div className="mb-8 text-center">
            <Badge className="mb-2 bg-green-100 text-green-800">Flexible Schedule</Badge>
            <h2 className="text-3xl font-bold mb-3 text-green-800">CHOOSE YOUR PERFECT TIME</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our flexible batch schedule is designed to harmonize with your natural rhythms and daily routine.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Morning Batches */}
            <Card className="overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-yellow-400 to-yellow-600"></div>
              <div className="p-6">
                <div className="flex items-center justify-center mb-5">
                  <div className="p-3 rounded-full bg-yellow-100 mr-3">
                    <Sun className="h-7 w-7 text-yellow-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-green-700">Morning Batch</h3>
                </div>
                <div className="space-y-4">
                  <BatchTime number="1" time="5:30 - 6:30" isNew={true} />
                  <BatchTime number="2" time="6:40 - 7:40" />
                  <BatchTime number="3" time="7:50 - 8:50" />
                </div>
              </div>
            </Card>

            {/* Evening Batches */}
            <Card className="overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-indigo-400 to-purple-500"></div>
              <div className="p-6">
                <div className="flex items-center justify-center mb-5">
                  <div className="p-3 rounded-full bg-indigo-100 mr-3">
                    <Moon className="h-7 w-7 text-indigo-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-green-700">Evening Batch</h3>
                </div>
                <div className="space-y-4">
                  <BatchTime number="4" time="5:30 - 6:30" />
                  <BatchTime number="5" time="6:40 - 7:40" isNew={true} />
                  <BatchTime number="6" time="7:50 - 8:50" />
                </div>
              </div>
            </Card>
          </div>

          <div className="text-center">
            <p className="text-gray-600 italic mb-4">
              "Find the time that aligns with your energy and schedule. Your journey to wellness should fit seamlessly
              into your life."
            </p>
          </div>
        </div>
      </div>

      {/* Page 3: Offerings */}
      <div className="max-w-4xl mx-auto mb-16 page">
        <div className="border border-gray-200 rounded-xl p-8 bg-white">
          <div className="mb-8 text-center">
            <Badge className="mb-2 bg-green-100 text-green-800">Our Services</Badge>
            <h2 className="text-3xl font-bold mb-3 text-green-800">HOLISTIC WELLNESS OFFERINGS</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Discover our comprehensive approach to wellness, inspired by ancient wisdom and modern science.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <OfferingCard
              icon={<Calendar className="h-10 w-10 text-green-600" />}
              title="Flexible Batches"
              description="Join any of our six daily sessions that align with your natural rhythm."
            />
            <OfferingCard
              icon={<Users className="h-10 w-10 text-green-600" />}
              title="Yoga for Health"
              description="Gentle practices to improve mobility, reduce stress, and enhance your connection with nature."
            />
            <OfferingCard
              icon={<Dumbbell className="h-10 w-10 text-green-600" />}
              title="Light Muscle Training"
              description="Strengthen your body with movements inspired by natural forms and patterns."
            />
            <OfferingCard
              icon={<Utensils className="h-10 w-10 text-green-600" />}
              title="Natural Diet Plans"
              description="Nourish your body with seasonal, wholesome nutrition plans."
            />
            <OfferingCard
              icon={<Brain className="h-10 w-10 text-green-600" />}
              title="Mental Wellness"
              description="Forest-inspired meditation and mindfulness practices for inner peace."
            />
            <OfferingCard
              icon={<CheckCircle className="h-10 w-10 text-green-600" />}
              title="Orientation Sessions"
              description="Begin your journey with guidance that honors your unique path."
            />
          </div>
        </div>
      </div>

      {/* Page 4: Subscription Plans */}
      <div className="max-w-4xl mx-auto mb-16 page">
        <div className="border border-gray-200 rounded-xl p-8 bg-white">
          <div className="mb-8 text-center">
            <Badge className="mb-2 bg-green-100 text-green-800">Membership</Badge>
            <h2 className="text-3xl font-bold mb-3 text-green-800">SUBSCRIPTION PLANS</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Choose the plan that best suits your wellness journey and commitment level.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <PlanCard
              name="Monthly Plan"
              price="₹1,999"
              period="per month"
              features={[
                "Access to all basic yoga sessions",
                "Monthly progress tracking",
                "Email support",
                "Access to community forums",
              ]}
              highlight={false}
            />
            <PlanCard
              name="Quarterly Plan"
              price="₹4,999"
              period="per quarter"
              features={[
                "Access to all basic and intermediate yoga sessions",
                "Quarterly progress tracking",
                "Priority email support",
                "Access to community forums",
                "One free personal consultation",
              ]}
              highlight={true}
            />
            <PlanCard
              name="Annual Plan"
              price="₹14,999"
              period="per year"
              features={[
                "Access to all yoga sessions (basic, intermediate, advanced)",
                "Annual progress tracking",
                "Priority email and phone support",
                "Access to community forums",
                "Quarterly personal consultations",
                "Exclusive workshops and events",
              ]}
              highlight={false}
            />
          </div>

          <div className="text-center">
            <p className="text-gray-600 italic mb-4">
              "Invest in yourself. Your wellness journey is the most important investment you'll ever make."
            </p>
          </div>
        </div>
      </div>

      {/* Page 5: Contact & Join */}
      <div className="max-w-4xl mx-auto mb-16 page">
        <div className="border border-gray-200 rounded-xl p-8 bg-white">
          <div className="mb-8 text-center">
            <Badge className="mb-2 bg-green-100 text-green-800">Join Us</Badge>
            <h2 className="text-3xl font-bold mb-3 text-green-800">BEGIN YOUR JOURNEY TODAY</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Take the first step toward a more balanced, mindful, and healthy life.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-bold mb-4 text-green-700">Our Approach to Wellness</h3>
              <div className="space-y-4 mb-6">
                <WellnessItem
                  icon={<Wind className="h-6 w-6 text-green-600" />}
                  title="MINDFUL MOVEMENT"
                  content="Our approach combines gentle yoga poses, mindful breathing, and natural movement patterns."
                />
                <WellnessItem
                  icon={<Heart className="h-6 w-6 text-green-600" />}
                  title="FOREST MEDITATION"
                  content="Our meditation practices draw inspiration from the tranquility of forests."
                />
                <WellnessItem
                  icon={<Utensils className="h-6 w-6 text-green-600" />}
                  title="NATURAL NUTRITION"
                  content="Our mindful eating plans are designed to nourish your body with seasonal, whole foods."
                />
              </div>
            </div>

            <div className="bg-green-50 p-6 rounded-xl">
              <h3 className="text-xl font-bold mb-4 text-green-700">Connect With Us</h3>
              <div className="mb-6">
                <p className="mb-2">
                  <strong>Email:</strong> sthavishtah2024@gmail.com
                </p>
                <p className="mb-2">
                  <strong>Instagram:</strong> @sthavishtah
                </p>
                <p className="mb-4">
                  <strong>Location:</strong> Bengaluru, India
                </p>
              </div>

              <div className="bg-white p-5 rounded-lg shadow-md">
                <div className="text-green-800 font-bold mb-3 text-center">SCAN FOR WHATSAPP CHANNEL</div>
                <div className="h-40 w-40 mx-auto bg-gray-200 rounded-lg flex items-center justify-center">
                  <div className="text-sm text-gray-500">QR Code Image</div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xl text-green-700 font-semibold mb-4">JOIN NOW FOR FREE SESSIONS FOR 1 MONTH</p>
            <p className="text-gray-600 mb-6">
              Limited time offer for new members. Sessions starting from May 12, 2025.
            </p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          .page {
            page-break-after: always;
          }
          .print:hidden {
            display: none;
          }
        }
      `}</style>
    </div>
  )
}

function BatchTime({ number, time, isNew = false }) {
  return (
    <div className="flex items-center p-3 border rounded-lg bg-green-50/50 hover:bg-green-50 transition-colors shadow-sm">
      <Badge variant="outline" className="mr-3 px-2 py-1 text-xs font-bold border-green-200 bg-green-50 text-green-800">
        BATCH {number}
      </Badge>
      <span className="font-medium text-green-800">{time}</span>
      {isNew && <span className="ml-auto bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">New</span>}
    </div>
  )
}

function OfferingCard({ icon, title, description }) {
  return (
    <Card className="h-full bg-white/90 hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 p-3 bg-green-50 rounded-full">{icon}</div>
          <h3 className="text-lg font-semibold mb-3 text-green-700">{title}</h3>
          <p className="text-gray-600 text-sm">{description}</p>
        </div>
      </div>
    </Card>
  )
}

function PlanCard({ name, price, period, features, highlight }) {
  return (
    <Card className={`overflow-hidden ${highlight ? "ring-2 ring-green-500 shadow-lg" : ""}`}>
      {highlight && <div className="h-1.5 bg-green-500 w-full"></div>}
      <div className="p-6">
        <div className="text-center mb-4">
          <h3 className="text-xl font-bold text-green-800 mb-2">{name}</h3>
          <div className="flex items-center justify-center">
            <span className="text-3xl font-bold">{price}</span>
            <span className="text-sm text-gray-500 ml-1">{period}</span>
          </div>
        </div>
        <ul className="space-y-2 mb-6">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
        <Button className={`w-full ${highlight ? "bg-green-600 hover:bg-green-700" : ""}`}>Select Plan</Button>
      </div>
    </Card>
  )
}

function WellnessItem({ icon, title, content }) {
  return (
    <div className="flex">
      <div className="mr-4 mt-1">{icon}</div>
      <div>
        <h4 className="font-semibold text-green-800">{title}</h4>
        <p className="text-sm text-gray-600">{content}</p>
      </div>
    </div>
  )
}
