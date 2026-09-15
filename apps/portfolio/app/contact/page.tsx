
import ContactPage from "@/components/contact-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Contact | Morgan Barber",
    description: "Get in touch with Morgan Barber for cybersecurity inquiries or collaboration.",
    openGraph: {
        title: "Contact | Morgan Barber",
        description: "Secure communication channel for Morgan Barber.",
        url: "https://morganbarber.me/contact",
    }
};

export default function Contact() {
    return <ContactPage />;
}
