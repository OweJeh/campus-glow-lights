import { Shield, ChevronLeft, HelpCircle, MessageCircle, FileText, Info, Lightbulb, QrCode, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import ugLogo from "@/assets/ug-logo.png";
import DeveloperCredit from "@/components/DeveloperCredit";

const faqs = [
    {
        question: "What is Campus Glow?",
        answer: "Campus Glow is an intelligent streetlight management and reporting platform designed for the University of Ghana. It enables students and staff to report faulty streetlights instantly, ensuring a safer and well-lit campus for everyone.",
        icon: Info
    },
    {
        question: "How do I report a faulty streetlight?",
        answer: "Simply find the unique QR code on the streetlight pole, scan it with your smartphone's camera, and you'll be directed to a tailored report form. Capture a photo of the fault, select the issue type, and submit directly through the web app.",
        icon: QrCode
    },
    {
        question: "Why is photo proof required for reports?",
        answer: "Photo verification ensures our maintenance teams can accurately diagnose the issue before arriving on site. It helps identify specifically what parts are needed and validates the reported fault to prevent unnecessary trips or false alarms.",
        icon: Lightbulb
    },
    {
        question: "What happens after I submit a report?",
        answer: "Once submitted, your report is instantly synced with our central dashboard. University maintenance teams are notified and can prioritize repairs based on the severity and frequency of reports for that specific location.",
        icon: FileText
    },
    {
        question: "Is there a mobile app I need to download?",
        answer: "No, Campus Glow is a progressive web application. You don't need to download anything from the App Store or Play Store. Simply scan the QR code, and the tool opens directly in your mobile browser, saving you time and storage space.",
        icon: Shield
    },
    {
        question: "Which parts of the University of Ghana are covered?",
        answer: "Currently, our system tracks streetlights across the Legon campus, including major roads like J.B. Danquah Road, student residential areas, and faculty zones. We are continuously expanding our database to include every light pole on every UG campus.",
        icon: MapPin
    },
    {
        question: "Is my personal information tracked?",
        answer: "We only collect optional contact information if you choose to provide it for follow-up questions. Your privacy and safety are paramount; the primary focus is the location (Pole ID) and the nature of the electrical fault.",
        icon: Info
    },
    {
        question: "Who can I contact for urgent safety concerns?",
        answer: "For immediate safety emergencies (like exposed wires or sparking), please contact the University Security or Maintenance hotline immediately, as this system is for reporting maintenance issues rather than handling 911-style emergencies.",
        icon: MessageCircle
    }
];

const FAQ = () => {
    return (
        <div className="min-h-screen bg-muted/20 pb-12">
            {/* Header */}
            <div className="bg-primary text-primary-foreground px-4 py-8 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
                <div className="flex flex-col items-center gap-4 max-w-2xl mx-auto relative">
                    <Link to="/" className="absolute left-0 top-1/2 -translate-y-1/2 p-2 hover:bg-white/10 rounded-full transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                    </Link>
                    <div className="w-16 h-16 rounded-2xl bg-white/20 p-2.5 shadow-inner">
                        <img src={ugLogo} alt="UG Logo" className="w-full h-full object-contain" />
                    </div>
                    <div className="text-center">
                        <h1 className="text-2xl font-display font-bold tracking-tight">Campus Glow Support</h1>
                        <p className="text-xs opacity-80 uppercase tracking-widest font-bold text-white/90">Frequently Asked Questions</p>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto p-4 mt-6 space-y-6">
                <div className="text-center space-y-2 mb-8">
                    <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-2">
                        <HelpCircle className="w-6 h-6 text-primary" />
                    </div>
                    <h2 className="text-2xl font-display font-bold text-foreground">How can we help?</h2>
                    <p className="text-muted-foreground text-sm">Everything you need to know about reporting and site usage.</p>
                </div>

                <Accordion type="single" collapsible className="w-full space-y-4">
                    {faqs.map((faq, index) => (
                        <AccordionItem
                            key={index}
                            value={`item-${index}`}
                            className="border rounded-2xl bg-card px-4 py-1 shadow-sm data-[state=open]:border-primary/30 transition-all"
                        >
                            <AccordionTrigger className="hover:no-underline py-4">
                                <div className="flex items-center gap-4 text-left">
                                    <div className="p-2.5 bg-muted rounded-xl text-primary group-data-[state=open]:bg-primary group-data-[state=open]:text-white transition-colors">
                                        <faq.icon className="w-5 h-5" />
                                    </div>
                                    <span className="font-semibold text-foreground text-base leading-tight">{faq.question}</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground leading-relaxed text-sm pt-2 pb-6 pl-14 pr-4">
                                {faq.answer}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>

                {/* Contact Note */}
                <div className="rounded-2xl border-2 border-dashed border-muted p-8 text-center space-y-4 bg-background/50 mt-12">
                    <p className="text-sm font-medium text-foreground">Still have questions?</p>
                    <p className="text-xs text-muted-foreground">If you couldn't find what you're looking for, feel free to reach out to the developer or campus maintenance team.</p>
                    <Button variant="outline" className="rounded-xl font-bold" asChild>
                        <Link to="/report?poleId=UG-LG-001">Go to Reporter</Link>
                    </Button>
                </div>
            </div>

            <footer className="border-t py-8 text-center text-xs text-muted-foreground mt-8">
                University of Ghana, Legon — Campus Glow © {new Date().getFullYear()}
                <DeveloperCredit />
            </footer>
        </div>
    );
};

export default FAQ;
