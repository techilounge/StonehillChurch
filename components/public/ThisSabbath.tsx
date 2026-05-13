import React from "react";
import { Clock, MapPin, Coffee, Users } from "lucide-react";

interface ThisSabbathProps {
  settings?: Record<string, string | undefined>;
}

export function ThisSabbath({ settings = {} }: ThisSabbathProps) {
  const breakfastServiceTime = settings["service_times.breakfast_service"] || "Saturdays · 9:00am";
  const sabbathSchoolTime = settings["service_times.sabbath_school"] || "Saturdays · 10:00am";
  const worshipServiceTime =
    settings["service_times.divine_worship"] ||
    settings["service_times.worship_service"] ||
    "Saturdays · 11:00am";
  const fellowshipMealTime = settings["service_times.fellowship_meal"] || "1:00 PM (1st & 3rd Sabbaths)";

  return (
    <section className="py-16 bg-white sm:py-24 border-y border-stonehill-line overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-stonehill-evergreen sm:text-4xl">
            This Sabbath at Stonehill
          </h2>
          <p className="mt-4 text-lg text-stonehill-ink/80">
            Join us every Saturday for worship, study, and community.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Breakfast Service */}
          <div className="flex flex-col items-center text-center p-6 bg-stonehill-cream rounded-2xl border border-stonehill-line">
            <div className="mb-4 bg-stonehill-evergreen/10 p-4 rounded-full text-stonehill-evergreen">
              <Coffee className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-stonehill-ink mb-2">Breakfast Service</h3>
            <div className="flex items-center text-stonehill-gold font-medium mb-3">
              <Clock className="w-5 h-5 mr-2" />
              <span>{breakfastServiceTime}</span>
            </div>
            <p className="text-stonehill-ink/80">
              Share a simple meal and warm conversation with the church family before worship.
            </p>
          </div>

          {/* Sabbath School */}
          <div className="flex flex-col items-center text-center p-6 bg-stonehill-cream rounded-2xl border border-stonehill-line">
            <div className="mb-4 bg-stonehill-evergreen/10 p-4 rounded-full text-stonehill-evergreen">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-stonehill-ink mb-2">Sabbath School</h3>
            <div className="flex items-center text-stonehill-gold font-medium mb-3">
              <Clock className="w-5 h-5 mr-2" />
              <span>{sabbathSchoolTime}</span>
            </div>
            <p className="text-stonehill-ink/80">
              Bible study groups for all ages. Come discover and discuss God&apos;s word together.
            </p>
          </div>

          {/* Divine Worship */}
          <div className="flex flex-col items-center text-center p-6 bg-stonehill-evergreen text-white rounded-2xl shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <MapPin className="w-24 h-24" />
            </div>
            <div className="mb-4 bg-white/20 p-4 rounded-full text-white relative z-10">
              <MapPin className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-2 relative z-10">Divine Worship</h3>
            <div className="flex items-center text-stonehill-gold font-medium mb-3 relative z-10">
              <Clock className="w-5 h-5 mr-2" />
              <span>{worshipServiceTime}</span>
            </div>
            <p className="text-white/90 relative z-10">
              Our main worship service featuring uplifting music, prayer, and a biblical message.
            </p>
          </div>

          {/* Fellowship Meal */}
          <div className="flex flex-col items-center text-center p-6 bg-stonehill-cream rounded-2xl border border-stonehill-line">
            <div className="mb-4 bg-stonehill-evergreen/10 p-4 rounded-full text-stonehill-evergreen">
              <Coffee className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-stonehill-ink mb-2">Fellowship Meal</h3>
            <div className="flex items-center text-stonehill-gold font-medium mb-3">
              <Clock className="w-5 h-5 mr-2" />
              <span>{fellowshipMealTime}</span>
            </div>
            <p className="text-stonehill-ink/80">
              Join us for a vegetarian potluck meal after the service. Guests are always welcome!
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
