"use client";

import {useParams, useRouter} from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {useApprovePlace, usePlace, useRejectPlace} from "@/hooks/use-places";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Separator} from "@/components/ui/separator";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Skeleton} from "@/components/ui/skeleton";
import {
    Activity,
    ArrowLeft,
    BedDouble,
    Bus,
    Calendar,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    CircleDot,
    Clock,
    DollarSign,
    ExternalLink,
    Eye,
    Facebook,
    Globe,
    Heart,
    History,
    Images,
    Instagram,
    Linkedin,
    Mail,
    MapPin,
    MessageSquare,
    Phone,
    ShoppingBag,
    Star,
    Ticket,
    TreePine,
    Twitter,
    Users,
    Utensils,
    Wifi,
    X,
    XCircle,
} from "lucide-react";
import {formatDate} from "@/lib/utils";
import {useCallback, useMemo, useState} from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {Textarea} from "@/components/ui/textarea";
import {Label} from "@/components/ui/label";
import {useQuery} from "@tanstack/react-query";
import api from "@/lib/api";
import type {
    Accommodation,
    Entertainment,
    Facility,
    FileEntity,
    HealthWellness,
    NatureOutdoors,
    OpeningHours,
    PlaceModerationHistoryItem,
    PlaceReview,
    Restaurant,
    Shopping,
    SocialLinks,
    Tag,
    Transport,
} from "@/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DAY_LABELS: Record<string, string> = {
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    sunday: "Sunday",
};

const MODERATION_META: Record<string, { label: string; color: string; dot: string }> = {
    submitted: {label: "Submitted for review", color: "text-blue-600 dark:text-blue-400", dot: "bg-blue-500"},
    resubmitted: {label: "Re-submitted by owner", color: "text-amber-600 dark:text-amber-400", dot: "bg-amber-500"},
    rejected: {label: "Rejected", color: "text-red-600 dark:text-red-400", dot: "bg-red-500"},
    approved: {label: "Approved", color: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500"},
    verification_revoked: {
        label: "Verification revoked",
        color: "text-orange-600 dark:text-orange-400",
        dot: "bg-orange-500"
    },
};

// ─── Small helpers ─────────────────────────────────────────────────────────────

function InfoRow({icon: Icon, children, className = ""}: {
    icon: React.ElementType;
    children: React.ReactNode;
    className?: string
}) {
    return (
        <div className={`flex items-start gap-3 text-sm ${className}`}>
            <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
                <Icon className="h-3.5 w-3.5 text-muted-foreground"/>
            </span>
            <span className="pt-1 leading-snug">{children}</span>
        </div>
    );
}

function SectionLabel({children}: { children: React.ReactNode }) {
    return <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{children}</p>;
}

function TagPill({children}: { children: React.ReactNode }) {
    return (
        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium">
            {children}
        </span>
    );
}

function TagList({label, items}: { label: string; items?: string[] }) {
    if (!items?.length) return null;
    return (
        <div>
            <SectionLabel>{label}</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
                {items.map((item) => <TagPill key={item}>{item}</TagPill>)}
            </div>
        </div>
    );
}

function BookingLink({url, label = "Book now"}: { url?: string | null; label?: string }) {
    if (!url) return null;
    return (
        <a href={url} target="_blank" rel="noopener noreferrer"
           className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted">
            <ExternalLink className="h-3 w-3"/>
            {label}
        </a>
    );
}

// ─── Price ─────────────────────────────────────────────────────────────────────

function PriceDisplay({place}: {
    place: {
        priceType?: string | null; price?: number | null;
        minPrice?: number | null; maxPrice?: number | null;
        oldPrice?: number | null; isPriceOnRequest?: boolean
    }
}) {
    if (!place.priceType) return null;
    let label = "";
    if (place.priceType === "free") label = "Free";
    else if (place.priceType === "onRequest" || place.isPriceOnRequest) label = "Price on request";
    else if (place.priceType === "range" && place.minPrice != null && place.maxPrice != null)
        label = `$${place.minPrice} – $${place.maxPrice}`;
    else if (place.price != null) label = `$${place.price}`;
    if (!label) return null;
    return (
        <InfoRow icon={DollarSign}>
            <span className="font-medium">{label}</span>
            {place.oldPrice != null && (
                <span className="ml-2 line-through text-muted-foreground">${place.oldPrice}</span>
            )}
        </InfoRow>
    );
}

// ─── Opening hours ─────────────────────────────────────────────────────────────

function OpeningHoursTable({hours, openFullDay}: { hours: OpeningHours; openFullDay?: boolean }) {
    if (openFullDay) {
        return (
            <InfoRow icon={Clock}>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">Open 24 hours</span>
            </InfoRow>
        );
    }
    const hasAny = DAYS.some((d) => !!hours[d]);
    if (!hasAny) return null;
    return (
        <div>
            <SectionLabel>Opening hours</SectionLabel>
            <div className="overflow-hidden rounded-lg border divide-y text-sm">
                {DAYS.map((day) => {
                    const entry = hours[day];
                    if (!entry) return null;
                    const isToday = new Date().toLocaleDateString("en-US", {weekday: "long"}).toLowerCase() === day;
                    return (
                        <div key={day}
                             className={`flex items-center justify-between px-4 py-2 ${isToday ? "bg-accent font-medium" : ""}`}>
                            <span
                                className={isToday ? "text-accent-foreground" : "text-muted-foreground"}>{DAY_LABELS[day]}</span>
                            {entry.isClosed ? (
                                <span className="text-muted-foreground text-xs">Closed</span>
                            ) : (
                                <span>{entry.open} – {entry.close}</span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Social links ──────────────────────────────────────────────────────────────

function SocialRow({social}: { social: SocialLinks }) {
    const links = [
        {key: "facebook", icon: Facebook, label: "Facebook", href: social.facebook, color: "text-blue-600"},
        {key: "instagram", icon: Instagram, label: "Instagram", href: social.instagram, color: "text-pink-600"},
        {key: "twitter", icon: Twitter, label: "Twitter / X", href: social.twitter, color: "text-sky-500"},
        {key: "linkedin", icon: Linkedin, label: "LinkedIn", href: social.linkedin, color: "text-blue-700"},
    ].filter((l) => l.href);
    if (!links.length) return null;
    return (
        <div>
            <SectionLabel>Social media</SectionLabel>
            <div className="flex flex-wrap gap-2">
                {links.map(({key, icon: Icon, label, href, color}) => (
                    <a key={key} href={href!} target="_blank" rel="noopener noreferrer"
                       className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted">
                        <Icon className={`h-3.5 w-3.5 ${color}`}/>
                        {label}
                    </a>
                ))}
            </div>
        </div>
    );
}

// ─── Category-specific cards ───────────────────────────────────────────────────

function CategoryCard({icon: Icon, title, children}: {
    icon: React.ElementType; title: string; children: React.ReactNode
}) {
    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                        <Icon className="h-4 w-4 text-muted-foreground"/>
                    </span>
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-0">{children}</CardContent>
        </Card>
    );
}

function RestaurantDetails({data}: { data: Restaurant }) {
    const allImages = [...(data.menuImages ?? []), ...(data.dishImages ?? [])];
    return (
        <CategoryCard icon={Utensils} title="Restaurant details">
            <TagList label="Cuisine types" items={data.cuisineTypes}/>
            <TagList label="Dining options" items={data.diningOptions}/>
            <TagList label="Dietary options" items={data.dietaryOptions}/>
            {data.specialDishes && data.specialDishes.length > 0 && (
                <div>
                    <SectionLabel>Special dishes</SectionLabel>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {data.specialDishes.map((dish) => (
                            <div key={dish.id}
                                 className="flex gap-3 rounded-lg border p-3 text-sm">
                                {dish.file?.url && (
                                    <div className="relative h-16 w-16 flex-shrink-0 rounded-md overflow-hidden">
                                        <Image src={dish.file.url} alt={dish.title ?? ""} fill
                                               className="object-cover"/>
                                    </div>
                                )}
                                <div className="min-w-0">
                                    {dish.title && <p className="font-semibold truncate">{dish.title}</p>}
                                    {dish.description &&
                                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{dish.description}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {allImages.length > 0 && (
                <div>
                    <SectionLabel>Menu & dish photos</SectionLabel>
                    <div className="flex flex-wrap gap-2">
                        {allImages.map((img) => (
                            <div key={img.id}
                                 className="relative h-20 w-20 rounded-lg overflow-hidden ring-1 ring-border">
                                <Image src={img.url} alt="" fill className="object-cover"/>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </CategoryCard>
    );
}

function AccommodationDetails({data}: { data: Accommodation }) {
    return (
        <CategoryCard icon={BedDouble} title="Accommodation details">
            <div className="grid grid-cols-2 gap-3">
                {data.checkInTime && (
                    <div className="rounded-lg bg-muted/50 px-3 py-2.5">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">Check-in</p>
                        <p className="text-sm font-medium">{data.checkInTime}</p>
                    </div>
                )}
                {data.checkOutTime && (
                    <div className="rounded-lg bg-muted/50 px-3 py-2.5">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">Check-out</p>
                        <p className="text-sm font-medium">{data.checkOutTime}</p>
                    </div>
                )}
                {data.petsAllowed != null && (
                    <div className="rounded-lg bg-muted/50 px-3 py-2.5">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">Pets</p>
                        <p className="text-sm font-medium">{data.petsAllowed ? "✓ Allowed" : "✗ Not allowed"}</p>
                    </div>
                )}
                {data.ageRestriction && (
                    <div className="rounded-lg bg-muted/50 px-3 py-2.5">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">Age
                            restriction</p>
                        <p className="text-sm font-medium">{data.ageRestriction}</p>
                    </div>
                )}
            </div>
            <BookingLink url={data.bookingUrl}/>
            {data.roomTypes && data.roomTypes.length > 0 && (
                <div>
                    <SectionLabel>Room types</SectionLabel>
                    <div className="space-y-2">
                        {data.roomTypes.map((room, i) => (
                            <div key={i} className="rounded-lg border px-4 py-3">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="font-semibold text-sm">{room.name}</p>
                                    <Badge variant="secondary" className="text-xs">Capacity: {room.capacity}</Badge>
                                </div>
                                {room.description &&
                                    <p className="text-xs text-muted-foreground mt-1">{room.description}</p>}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </CategoryCard>
    );
}

function ShoppingDetails({data}: { data: Shopping }) {
    return (
        <CategoryCard icon={ShoppingBag} title="Shopping details">
            <TagList label="Product categories" items={data.productCategories}/>
            <TagList label="Brands carried" items={data.brandsCarried}/>
            {data.returnPolicy && (
                <div>
                    <SectionLabel>Return policy</SectionLabel>
                    <p className="text-sm text-muted-foreground leading-relaxed">{data.returnPolicy}</p>
                </div>
            )}
            <div className="flex flex-wrap gap-2">
                <BookingLink url={data.bookingUrl}/>
                <BookingLink url={data.onlineStoreUrl} label="Online store"/>
            </div>
        </CategoryCard>
    );
}

function TransportDetails({data}: { data: Transport }) {
    return (
        <CategoryCard icon={Bus} title="Transport details">
            {data.operator && (
                <div>
                    <SectionLabel>Operator</SectionLabel>
                    <p className="text-sm font-medium">{data.operator}</p>
                </div>
            )}
            <TagList label="Transport lines" items={data.transportLines}/>
            <TagList label="Destinations" items={data.destinations}/>
            <TagList label="Vehicle types" items={data.vehicleTypes}/>
            {data.rentalOptions && Object.keys(data.rentalOptions).length > 0 && (
                <div>
                    <SectionLabel>Rental pricing</SectionLabel>
                    <div className="grid grid-cols-2 gap-2">
                        {data.rentalOptions.perHour != null && (
                            <div className="rounded-lg bg-muted/50 px-3 py-2.5">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Per hour</p>
                                <p className="text-sm font-semibold">${data.rentalOptions.perHour}</p>
                            </div>
                        )}
                        {data.rentalOptions.perDay != null && (
                            <div className="rounded-lg bg-muted/50 px-3 py-2.5">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Per day</p>
                                <p className="text-sm font-semibold">${data.rentalOptions.perDay}</p>
                            </div>
                        )}
                        {data.rentalOptions.perWeek != null && (
                            <div className="rounded-lg bg-muted/50 px-3 py-2.5">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Per week</p>
                                <p className="text-sm font-semibold">${data.rentalOptions.perWeek}</p>
                            </div>
                        )}
                        {data.rentalOptions.perMonth != null && (
                            <div className="rounded-lg bg-muted/50 px-3 py-2.5">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Per month</p>
                                <p className="text-sm font-semibold">${data.rentalOptions.perMonth}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
            <BookingLink url={data.bookingUrl}/>
        </CategoryCard>
    );
}

function HealthWellnessDetails({data}: { data: HealthWellness }) {
    return (
        <CategoryCard icon={Activity} title="Health & Wellness details">
            <TagList label="Services offered" items={data.servicesOffered}/>
            {data.practitioners && data.practitioners.length > 0 && (
                <div>
                    <SectionLabel>Practitioners</SectionLabel>
                    <div className="space-y-2">
                        {data.practitioners.map((p, i) => (
                            <div key={i} className="rounded-lg border px-4 py-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">
                                        <Users className="h-3.5 w-3.5 text-muted-foreground"/>
                                    </div>
                                    <p className="font-semibold text-sm">{p.name}</p>
                                </div>
                                {p.specialty && <p className="text-xs text-muted-foreground">{p.specialty}</p>}
                                {p.qualifications &&
                                    <p className="text-xs text-muted-foreground">{p.qualifications}</p>}
                                {p.yearsOfExperience != null && (
                                    <p className="text-xs text-muted-foreground mt-0.5">{p.yearsOfExperience} yrs
                                        experience</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <div className="flex flex-wrap gap-2">
                <BookingLink url={data.appointmentBookingUrl} label="Book appointment"/>
                <BookingLink url={data.bookingUrl}/>
            </div>
        </CategoryCard>
    );
}

function NatureOutdoorsDetails({data}: { data: NatureOutdoors }) {
    return (
        <CategoryCard icon={TreePine} title="Nature & Outdoors details">
            <div className="grid grid-cols-2 gap-2">
                {data.entryFee && (
                    <div className="rounded-lg bg-muted/50 px-3 py-2.5">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Entry fee</p>
                        <p className="text-sm font-semibold">{data.entryFee}</p>
                    </div>
                )}
                {data.bestTimeToVisit && (
                    <div className="rounded-lg bg-muted/50 px-3 py-2.5 col-span-2">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Best time to
                            visit</p>
                        <p className="text-sm font-medium mt-0.5">{data.bestTimeToVisit}</p>
                    </div>
                )}
            </div>
            <TagList label="Key activities" items={data.keyActivities}/>
            <TagList label="Key exhibits" items={data.keyExhibits}/>
            <TagList label="Rules" items={data.rules}/>
        </CategoryCard>
    );
}

function EntertainmentDetails({data}: { data: Entertainment }) {
    return (
        <CategoryCard icon={Ticket} title="Entertainment details">
            {data.ageRestriction && (
                <div
                    className="inline-flex items-center rounded-full bg-orange-100 dark:bg-orange-500/15 px-3 py-1 text-xs font-medium text-orange-700 dark:text-orange-400">
                    Age restriction: {data.ageRestriction}
                </div>
            )}
            {data.eventSchedule && (
                <div>
                    <SectionLabel>Event schedule</SectionLabel>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{data.eventSchedule}</p>
                </div>
            )}
            {data.ticketPrice && Object.keys(data.ticketPrice).length > 0 && (
                <div>
                    <SectionLabel>Ticket prices</SectionLabel>
                    <div className="grid grid-cols-2 gap-2">
                        {Object.entries(data.ticketPrice).map(([k, v]) => (
                            <div key={k} className="rounded-lg bg-muted/50 px-3 py-2.5">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest capitalize">{k}</p>
                                <p className="text-sm font-semibold">${String(v)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <TagList label="Current exhibits" items={data.currentExhibits}/>
            <BookingLink url={data.ticketBookingUrl} label="Buy tickets"/>
        </CategoryCard>
    );
}

// ─── Gallery Modal ─────────────────────────────────────────────────────────────

function GalleryModal({images, initialIndex, open, onOpenChange}: {
    images: FileEntity[]; initialIndex: number; open: boolean; onOpenChange: (v: boolean) => void;
}) {
    const [current, setCurrent] = useState(initialIndex);
    const prev = useCallback(() => setCurrent((c) => (c - 1 + images.length) % images.length), [images.length]);
    const next = useCallback(() => setCurrent((c) => (c + 1) % images.length), [images.length]);

    if (!open) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl p-0 overflow-hidden bg-zinc-950 border-zinc-800">
                <DialogHeader className="sr-only">
                    <DialogTitle>Image gallery</DialogTitle>
                    <DialogDescription>Browse all place images</DialogDescription>
                </DialogHeader>

                {/* Main image */}
                <div className="relative flex items-center justify-center bg-zinc-950" style={{minHeight: "65vh"}}>
                    <div className="relative w-full h-full" style={{aspectRatio: "16/9"}}>
                        <Image src={images[current].url} alt={`Photo ${current + 1}`} fill className="object-contain"/>
                    </div>

                    {images.length > 1 && (
                        <>
                            <button onClick={prev}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/70 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white hover:bg-black/90 transition-all">
                                <ChevronLeft className="h-5 w-5"/>
                            </button>
                            <button onClick={next}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/70 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white hover:bg-black/90 transition-all">
                                <ChevronRight className="h-5 w-5"/>
                            </button>
                        </>
                    )}

                    <button onClick={() => onOpenChange(false)}
                            className="absolute top-4 right-4 h-9 w-9 rounded-full bg-black/70 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white hover:bg-black/90 transition-all">
                        <X className="h-4 w-4"/>
                    </button>

                    <div
                        className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-black/60 backdrop-blur-sm px-3 py-1.5">
                        <span className="text-white text-xs font-medium">{current + 1}</span>
                        <span className="text-white/40 text-xs">/</span>
                        <span className="text-white/60 text-xs">{images.length}</span>
                    </div>
                </div>

                {/* Thumbnail strip */}
                {images.length > 1 && (
                    <div className="flex gap-2 p-3 overflow-x-auto bg-zinc-900/80 border-t border-zinc-800">
                        {images.map((img, i) => (
                            <button key={img.id} onClick={() => setCurrent(i)}
                                    className={`relative flex-shrink-0 h-16 w-16 rounded-lg overflow-hidden border-2 transition-all ${
                                        i === current
                                            ? "border-white scale-105"
                                            : "border-transparent opacity-50 hover:opacity-80 hover:scale-105"
                                    }`}>
                                <Image src={img.url} alt="" fill className="object-cover"/>
                            </button>
                        ))}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

// ─── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({icon: Icon, label, value, iconClass, href}: {
    icon: React.ElementType; label: string; value: React.ReactNode; iconClass: string; href?: string;
}) {
    const content = (
        <CardContent className="p-4 flex items-center gap-3 h-full">
            <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${iconClass}`}>
                <Icon className="h-5 w-5"/>
            </span>
            <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
                <p className="font-bold text-sm truncate mt-0.5">{value}</p>
            </div>
        </CardContent>
    );
    if (href) {
        return (
            <Card className="overflow-hidden hover:shadow-md transition-all">
                <Link href={href} className="block h-full hover:bg-muted/30 transition-colors">{content}</Link>
            </Card>
        );
    }
    return <Card className="overflow-hidden">{content}</Card>;
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function PlaceDetailPage() {
    const {id} = useParams<{ id: string }>();
    const router = useRouter();
    const [rejectOpen, setRejectOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [galleryOpen, setGalleryOpen] = useState(false);
    const [galleryIndex, setGalleryIndex] = useState(0);

    const {data: place, isLoading} = usePlace(Number(id));
    const approve = useApprovePlace();
    const reject = useRejectPlace();

    const moderationEntriesNewestFirst = useMemo(
        () => place?.moderationHistory?.length ? [...place.moderationHistory].reverse() : [],
        [place?.moderationHistory],
    );

    const {data: reviews, isLoading: reviewsLoading} = useQuery({
        queryKey: ["place-reviews", id],
        queryFn: async () => {
            const {data} = await api.get<{ data: PlaceReview[] }>(`/places/${id}/reviews`);
            return data.data ?? data;
        },
        enabled: !!id,
    });

    const openGallery = (index: number) => {
        setGalleryIndex(index);
        setGalleryOpen(true);
    };

    const handleReject = () => {
        if (!rejectReason.trim()) return;
        reject.mutate({id: Number(id), reason: rejectReason});
        setRejectOpen(false);
        setRejectReason("");
    };

    const categoryDetail = place
        ? place.restaurant ?? place.accommodation ?? place.shopping ?? place.transport
        ?? place.healthWellness ?? place.natureOutdoors ?? place.entertainment
        : null;

    // ── Loading skeleton
    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-lg"/>
                    <Skeleton className="h-7 w-56"/>
                </div>
                <Skeleton className="h-72 w-full rounded-2xl"/>
                <div className="grid grid-cols-6 gap-3">
                    {Array.from({length: 6}).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl"/>)}
                </div>
                <Skeleton className="h-10 w-80 rounded-lg"/>
                <div className="space-y-3">
                    {Array.from({length: 4}).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl"/>)}
                </div>
            </div>
        );
    }

    if (!place) {
        return (
            <div className="text-center py-20">
                <p className="text-muted-foreground">Place not found.</p>
                <Button variant="link" onClick={() => router.back()}>Go back</Button>
            </div>
        );
    }

    const images = place.images ?? [];

    return (
        <div className="space-y-6">

            {/* ── Header ── */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5"/>
                    </Button>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-2xl font-bold tracking-tight">{place.name}</h1>
                            {place.isFeatured && (
                                <Badge
                                    className="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-0">
                                    ★ Featured
                                </Badge>
                            )}
                            {place.isVerified === true && <Badge
                                className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-0">Approved</Badge>}
                            {place.isVerified === false && <Badge variant="destructive">Rejected</Badge>}
                            {place.isVerified === null && <Badge
                                className="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-0">Pending
                                review</Badge>}
                        </div>
                        {place.slug && <p className="text-muted-foreground text-sm mt-0.5 font-mono">{place.slug}</p>}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {place.isVerified !== false && (
                        <Button size="sm" variant="outline" onClick={() => setRejectOpen(true)}
                                className="border-destructive/40 text-destructive hover:bg-destructive hover:text-destructive-foreground">
                            <XCircle className="mr-1.5 h-4 w-4"/>
                            {place.isVerified === true ? "Revoke" : "Reject"}
                        </Button>
                    )}
                    {place.isVerified !== true && (
                        <Button size="sm" onClick={() => approve.mutate(place.id)} disabled={approve.isPending}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white">
                            <CheckCircle className="mr-1.5 h-4 w-4"/>
                            {place.isVerified === false ? "Re-approve" : "Approve"}
                        </Button>
                    )}
                </div>
            </div>

            {/* ── Rejection banner ── */}
            {place.isVerified === false && place.rejectionReason && (
                <div className="flex gap-3 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3">
                    <XCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5"/>
                    <div>
                        <p className="text-sm font-semibold text-destructive">Rejection reason</p>
                        <p className="text-sm text-muted-foreground mt-0.5 whitespace-pre-wrap">{place.rejectionReason}</p>
                    </div>
                </div>
            )}

            {/* ── Hero image gallery ── */}
            {images.length > 0 && (
                <div className="relative rounded-2xl overflow-hidden">
                    {images.length === 1 ? (
                        <button onClick={() => openGallery(0)} className="group block w-full relative h-72">
                            <Image src={images[0].url} alt={place.name} fill
                                   className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"/>
                        </button>
                    ) : (
                        <div className={`grid gap-1.5 h-72 ${images.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                            {/* Main large image */}
                            <button onClick={() => openGallery(0)}
                                    className={`group relative overflow-hidden ${images.length >= 3 ? "col-span-2 row-span-2" : ""}`}>
                                <Image src={images[0].url} alt={place.name} fill
                                       className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"/>
                            </button>
                            {/* Side images */}
                            {images.slice(1, 3).map((img: FileEntity, i: number) => (
                                <button key={img.id} onClick={() => openGallery(i + 1)}
                                        className="group relative overflow-hidden">
                                    <Image src={img.url} alt={place.name} fill
                                           className="object-cover transition-transform duration-300 group-hover:scale-[1.05]"/>
                                    {i === 1 && images.length > 3 && (
                                        <div
                                            className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center gap-1 text-white">
                                            <Images className="h-6 w-6 opacity-90"/>
                                            <span className="text-sm font-semibold">+{images.length - 3} more</span>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}

                    <button onClick={() => openGallery(0)}
                            className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-black/80 transition-all">
                        <Images className="h-3.5 w-3.5"/>
                        View all {images.length} photo{images.length !== 1 ? "s" : ""}
                    </button>
                </div>
            )}

            {/* ── Stats row ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {/* Creator — spans 2 cols */}
                <Card className="col-span-2 overflow-hidden hover:shadow-md transition-all">
                    {place.user?.id ? (
                        <Link href={`/users/${place.user.id}`} className="block h-full">
                            <CardContent
                                className="p-4 flex items-center gap-3 h-full hover:bg-muted/30 transition-colors">
                                {place.user.profileImage?.url ? (
                                    <Image src={place.user.profileImage.url}
                                           alt={place.user.fullName || place.user.email || "Avatar"}
                                           width={44} height={44}
                                           className="h-11 w-11 rounded-full object-cover ring-2 ring-border"/>
                                ) : (
                                    <div
                                        className="h-11 w-11 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-sm font-bold text-primary ring-2 ring-border">
                                        {(place.user.fullName || place.user.email || "U").charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div className="min-w-0">
                                    <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Creator</p>
                                    <p className="font-bold text-sm truncate mt-0.5">{place.user.fullName || `User #${place.user.id}`}</p>
                                    <p className="text-xs text-muted-foreground truncate">{place.user.email}</p>
                                </div>
                            </CardContent>
                        </Link>
                    ) : (
                        <CardContent className="p-4 flex items-center gap-3">
                            <div
                                className="h-11 w-11 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">—
                            </div>
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Creator</p>
                                <p className="font-bold text-sm mt-0.5">Unknown</p>
                            </div>
                        </CardContent>
                    )}
                </Card>

                <StatCard icon={Star} label="Rating"
                          value={`${place.averageRating != null ? Number(place.averageRating).toFixed(1) : "—"} (${place.reviewCount})`}
                          iconClass="bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"/>
                <StatCard icon={Eye} label="Views" value={place.viewCount.toLocaleString()}
                          iconClass="bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"/>
                <StatCard icon={Heart} label="Favorites" value={place.favoriteCount.toLocaleString()}
                          iconClass="bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400"/>
                <StatCard icon={Calendar} label="Created" value={formatDate(place.createdAt)}
                          iconClass="bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400"/>
            </div>

            {/* ── Tabs ── */}
            <Tabs defaultValue="reviews">
                <TabsList className="w-full justify-start">
                    <TabsTrigger value="reviews" className="gap-1.5">
                        <MessageSquare className="h-3.5 w-3.5"/>
                        Reviews
                        {(place.reviewCount ?? 0) > 0 && (
                            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{place.reviewCount}</Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="moderation" className="gap-1.5">
                        <History className="h-3.5 w-3.5"/>
                        Moderation
                    </TabsTrigger>
                    <TabsTrigger value="info" className="gap-1.5">
                        <CircleDot className="h-3.5 w-3.5"/>
                        Info
                    </TabsTrigger>
                    {categoryDetail && (
                        <TabsTrigger value="category" className="gap-1.5">
                            <Star className="h-3.5 w-3.5"/>
                            Category details
                        </TabsTrigger>
                    )}
                </TabsList>

                {/* ── Reviews tab ── */}
                <TabsContent value="reviews" className="mt-4">
                    <div className="space-y-3">
                        {reviewsLoading ? (
                            Array.from({length: 3}).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl"/>)
                        ) : reviews && reviews.length > 0 ? (
                            reviews.map((review: PlaceReview) => (
                                <Card key={review.id} className="overflow-hidden">
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex gap-3 flex-1">
                                                <div
                                                    className="h-9 w-9 flex-shrink-0 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-sm font-bold text-primary">
                                                    {(review.user?.fullName || "A").charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="font-semibold text-sm">{review.user?.fullName ?? "Anonymous"}</p>
                                                        <div className="flex items-center gap-0.5">
                                                            {Array.from({length: 5}).map((_, i) => (
                                                                <Star key={i}
                                                                      className={`h-3 w-3 ${i < review.rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}`}/>
                                                            ))}
                                                        </div>
                                                        <span
                                                            className="text-xs font-semibold text-amber-500">{review.rating}.0</span>
                                                    </div>
                                                    {review.comment && (
                                                        <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{review.comment}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-xs text-muted-foreground flex-shrink-0 whitespace-nowrap">{formatDate(review.createdAt)}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <Card>
                                <CardContent className="py-16 text-center">
                                    <MessageSquare className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30"/>
                                    <p className="text-sm font-medium text-muted-foreground">No reviews yet</p>
                                    <p className="text-xs text-muted-foreground/70 mt-1">Reviews will appear here once
                                        users rate this place.</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </TabsContent>

                {/* ── Moderation tab ── */}
                <TabsContent value="moderation" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2.5">
                                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                                    <History className="h-4 w-4"/>
                                </span>
                                Moderation history
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {moderationEntriesNewestFirst.length > 0 ? (
                                <ul className="relative space-y-0 pl-6">
                                    <div className="absolute left-2 top-2 bottom-2 w-px bg-border"/>
                                    {moderationEntriesNewestFirst.map((entry: PlaceModerationHistoryItem, idx) => {
                                        const meta = MODERATION_META[entry.eventType] ?? {
                                            label: entry.eventType, color: "text-foreground", dot: "bg-muted-foreground"
                                        };
                                        return (
                                            <li key={entry.id}
                                                className={`relative pb-6 last:pb-0 ${idx === 0 ? "pt-0" : "pt-0"}`}>
                                                <span
                                                    className={`absolute -left-[22px] top-1 h-3 w-3 rounded-full ring-2 ring-background ${meta.dot}`}/>
                                                <div
                                                    className={`text-sm font-semibold ${meta.color}`}>{meta.label}</div>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {formatDate(entry.createdAt)}
                                                    {(entry.actor?.fullName || entry.actor?.email) && (
                                                        <span> · {entry.actor?.fullName ?? entry.actor?.email}</span>
                                                    )}
                                                </p>
                                                {entry.eventType === "rejected" && entry.reason && (
                                                    <div
                                                        className="mt-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-muted-foreground whitespace-pre-wrap">
                                                        {entry.reason}
                                                    </div>
                                                )}
                                                {entry.eventType === "resubmitted" && entry.reason && (
                                                    <div
                                                        className="mt-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs">
                                                        <p className="font-semibold text-amber-700 dark:text-amber-300 mb-1">Admin
                                                            feedback at re-submit</p>
                                                        <p className="text-muted-foreground whitespace-pre-wrap">{entry.reason}</p>
                                                    </div>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : (
                                <div className="py-10 text-center">
                                    <History className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30"/>
                                    <p className="text-sm text-muted-foreground">No events recorded yet.</p>
                                    <p className="text-xs text-muted-foreground/70 mt-1">Run the latest migration to
                                        start logging moderation activity.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── Info tab ── */}
                <TabsContent value="info" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Place information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">

                            {/* Contact & location */}
                            {(place.address || place.city || place.state || place.country || place.phone || place.email || place.website) && (
                                <div className="space-y-3">
                                    <SectionLabel>Contact & location</SectionLabel>
                                    {(place.address || place.city || place.state || place.country) && (
                                        <InfoRow icon={MapPin}>
                                            {[place.address, place.postalCode, place.city?.name, place.state?.name, place.country?.name].filter(Boolean).join(", ")}
                                        </InfoRow>
                                    )}
                                    {place.phone && (
                                        <InfoRow icon={Phone}>{place.phone}</InfoRow>
                                    )}
                                    {place.email && (
                                        <InfoRow icon={Mail}>{place.email}</InfoRow>
                                    )}
                                    {place.website && (
                                        <InfoRow icon={Globe}>
                                            <a href={place.website} target="_blank" rel="noopener noreferrer"
                                               className="text-primary hover:underline break-all">{place.website}</a>
                                        </InfoRow>
                                    )}
                                    {place.latitude != null && place.longitude != null && (
                                        <InfoRow icon={MapPin} className="text-muted-foreground text-xs">
                                            {Number(place.latitude).toFixed(6)}, {Number(place.longitude).toFixed(6)}
                                        </InfoRow>
                                    )}
                                </div>
                            )}

                            {(place.address || place.phone) && place.priceType && <Separator/>}

                            {/* Pricing */}
                            {place.priceType && (
                                <div className="space-y-2">
                                    <SectionLabel>Pricing</SectionLabel>
                                    <PriceDisplay place={place}/>
                                </div>
                            )}

                            {/* Opening hours */}
                            {(place.openingHours || place.openFullDay) && (
                                <>
                                    <Separator/>
                                    <OpeningHoursTable hours={place.openingHours ?? {}}
                                                       openFullDay={place.openFullDay}/>
                                </>
                            )}

                            {/* Description */}
                            {place.description && (
                                <>
                                    <Separator/>
                                    <div>
                                        <SectionLabel>Description</SectionLabel>
                                        <p className="text-sm leading-relaxed text-muted-foreground">{place.description}</p>
                                    </div>
                                </>
                            )}

                            {/* Category & tags */}
                            <Separator/>
                            <div className="space-y-4">
                                <SectionLabel>Classification</SectionLabel>
                                <div className="flex flex-wrap gap-3">
                                    <div>
                                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Category</p>
                                        <Badge variant="secondary"
                                               className="text-xs px-2.5 py-1">{place.category?.name ?? "—"}</Badge>
                                    </div>
                                    {place.subcategory && (
                                        <div>
                                            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Subcategory</p>
                                            <Badge variant="outline"
                                                   className="text-xs px-2.5 py-1">{place.subcategory.name}</Badge>
                                        </div>
                                    )}
                                </div>

                                {place.tags && place.tags.length > 0 && (
                                    <div>
                                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Tags</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {place.tags.map((tag: Tag) => (
                                                <TagPill key={tag.id}>{tag.name}</TagPill>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Facilities */}
                            {place.facilities && place.facilities.length > 0 && (
                                <>
                                    <Separator/>
                                    <div>
                                        <SectionLabel>
                                            <Wifi className="h-3 w-3 inline mr-1.5"/>
                                            Facilities
                                        </SectionLabel>
                                        <div className="flex flex-wrap gap-1.5">
                                            {place.facilities.map((f: Facility) => (
                                                <span key={f.id}
                                                      className="inline-flex items-center rounded-lg bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground border border-border">
                                                    {f.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Social */}
                            {place.social && (
                                <>
                                    <Separator/>
                                    <SocialRow social={place.social}/>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── Category details tab ── */}
                {categoryDetail && (
                    <TabsContent value="category" className="mt-4 space-y-4">
                        {place.restaurant && <RestaurantDetails data={place.restaurant}/>}
                        {place.accommodation && <AccommodationDetails data={place.accommodation}/>}
                        {place.shopping && <ShoppingDetails data={place.shopping}/>}
                        {place.transport && <TransportDetails data={place.transport}/>}
                        {place.healthWellness && <HealthWellnessDetails data={place.healthWellness}/>}
                        {place.natureOutdoors && <NatureOutdoorsDetails data={place.natureOutdoors}/>}
                        {place.entertainment && <EntertainmentDetails data={place.entertainment}/>}
                    </TabsContent>
                )}
            </Tabs>

            {/* ── Gallery modal ── */}
            {images.length > 0 && (
                <GalleryModal images={images} initialIndex={galleryIndex} open={galleryOpen}
                              onOpenChange={setGalleryOpen}/>
            )}

            {/* ── Reject dialog ── */}
            <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Reject &quot;{place.name}&quot;</DialogTitle>
                        <DialogDescription>
                            The place owner will be notified with this reason.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Rejection
                            reason</Label>
                        <Textarea
                            placeholder="Describe why this place is being rejected..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            rows={4}
                            className="resize-none"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleReject}
                                disabled={!rejectReason.trim() || reject.isPending}>
                            <XCircle className="mr-1.5 h-4 w-4"/>
                            Reject place
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
