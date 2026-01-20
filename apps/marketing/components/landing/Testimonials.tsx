const testimonials = [
  {
    quote:
      "Lume cut our order time in half. Tables turn faster and our servers can actually focus on hospitality instead of running back and forth.",
    author: "Marco R.",
    role: "Owner",
    restaurant: "The Copper Pot",
    location: "Toronto, ON",
  },
  {
    quote:
      "Our servers went from handling 4 tables to 6 in the first week. The ROI was instant. Guests love that they can pay whenever they're ready.",
    author: "Sarah L.",
    role: "General Manager",
    restaurant: "Bistro 47",
    location: "Vancouver, BC",
  },
  {
    quote:
      "No more waiting to flag down a server for the bill. Our dinner rush runs smoother than ever, and our reviews have never been better.",
    author: "James T.",
    role: "Owner",
    restaurant: "The Local Kitchen",
    location: "Calgary, AB",
  },
];

export default function Testimonials() {
  return (
    <section className="py-16 lg:py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 lg:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-navy-500">
            Trusted by Canadian Restaurants
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            See what restaurant owners across Canada are saying about Lume.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm hover:shadow-lg transition-shadow"
            >
              {/* Quote */}
              <div className="mb-6">
                <svg
                  className="w-8 h-8 text-orange-400 mb-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
                <p className="text-slate-700 leading-relaxed">
                  {testimonial.quote}
                </p>
              </div>

              {/* Author */}
              <div className="border-t border-slate-100 pt-4">
                <p className="font-semibold text-navy-500">
                  {testimonial.author}
                </p>
                <p className="text-sm text-slate-500">
                  {testimonial.role}, {testimonial.restaurant}
                </p>
                <p className="text-sm text-slate-400">{testimonial.location}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
