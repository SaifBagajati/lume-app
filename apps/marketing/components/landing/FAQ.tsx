"use client";

import { useState } from "react";

const faqs = [
  {
    question: "Do my guests need to download an app?",
    answer:
      "No. Guests simply scan a QR code with their phone camera and the menu opens directly in their browser. No app download, no account creation required.",
  },
  {
    question: "How does Lume integrate with my POS?",
    answer:
      "We connect directly with Square, Toast, and other major POS systems. Your menu items, prices, and modifiers sync automatically. When an order comes through Lume, it appears in your POS just like any other order.",
  },
  {
    question: "Can guests still order from a server if they want to?",
    answer:
      "Absolutely. Lume is optional for guests. Many diners prefer the convenience, but servers can always take orders the traditional way. It's about giving your guests more options.",
  },
  {
    question: "How do payments work?",
    answer:
      "Guests pay directly through Lume using Apple Pay, Google Pay, or credit card. Funds are deposited directly to your merchant account. We never hold your money.",
  },
  {
    question: "Can guests split the bill?",
    answer:
      "Yes! Guests can split the bill by item or divide the total evenly with just one tap. No more complicated mental math or multiple card swipes.",
  },
  {
    question: "What happens if my internet goes down?",
    answer:
      "Your POS continues to work normally during internet outages. Lume orders will queue and sync automatically when your connection returns.",
  },
  {
    question: "Is there a long-term contract?",
    answer:
      "No contracts. Lume is month-to-month and you can cancel anytime. We believe in earning your business every month.",
  },
  {
    question: "How long does setup take?",
    answer:
      "Most restaurants are fully set up and taking orders within an hour. Connect your POS, customize your menu appearance, print QR codes for your tables, and you're live.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-16 lg:py-24 bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-navy-500">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Got questions? We&apos;ve got answers.
          </p>
        </div>

        {/* FAQ List */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-slate-200 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => toggle(index)}
                className="w-full flex items-center justify-between p-5 lg:p-6 text-left bg-white hover:bg-slate-50 transition-colors"
              >
                <span className="font-semibold text-navy-500 pr-4">
                  {faq.question}
                </span>
                <svg
                  className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {openIndex === index && (
                <div className="px-5 lg:px-6 pb-5 lg:pb-6 bg-white">
                  <p className="text-slate-600 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact */}
        <div className="mt-12 text-center">
          <p className="text-slate-600">
            Still have questions?{" "}
            <a
              href="mailto:hello@getlume.ca"
              className="text-orange-500 hover:text-orange-600 font-medium"
            >
              Reach out to our team
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
