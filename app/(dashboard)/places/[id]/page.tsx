'use client';

import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useApprovePlace, usePlace, useRejectPlace } from '@/hooks/use-places';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Activity,
  ArrowLeft,
  BedDouble,
  Bus,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
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
  Phone,
  Search,
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
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { usePlaces } from '@/hooks/use-places';
import { Input } from '@/components/ui/input';
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
} from '@/types';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS: Record<string, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
};

function moderationEventTitle(type: string): string {
  switch (type) {
    case 'submitted':
      return 'Submitted for review';
    case 'resubmitted':
      return 'Re-submitted by owner';
    case 'rejected':
      return 'Rejected';
    case 'approved':
      return 'Approved';
    case 'verification_revoked':
      return 'Verification revoked';
    default:
      return type;
  }
}

function PriceDisplay({
  place,
}: {
  place: {
    priceType?: string | null;
    price?: number | null;
    minPrice?: number | null;
    maxPrice?: number | null;
    oldPrice?: number | null;
    isPriceOnRequest?: boolean;
  };
}) {
  if (!place.priceType) return null;
  let label = '';
  if (place.priceType === 'free') label = 'Free';
  else if (place.priceType === 'onRequest' || place.isPriceOnRequest) label = 'Price on request';
  else if (place.priceType === 'range' && place.minPrice != null && place.maxPrice != null)
    label = `$${place.minPrice} – $${place.maxPrice}`;
  else if (place.price != null) label = `$${place.price}`;
  if (!label) return null;
  return (
    <div className="flex items-center gap-2 text-sm">
      <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <span>{label}</span>
      {place.oldPrice != null && (
        <span className="line-through text-muted-foreground text-xs">${place.oldPrice}</span>
      )}
    </div>
  );
}

function OpeningHoursTable({ hours, openFullDay }: { hours: OpeningHours; openFullDay?: boolean }) {
  if (openFullDay) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <span>Open 24 hours</span>
      </div>
    );
  }
  return (
    <div>
      <div className="flex items-center gap-2 mb-2 text-xs font-medium text-muted-foreground">
        <Clock className="h-4 w-4" />
        Opening hours
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
        {DAYS.map((day) => {
          const entry = hours[day];
          if (!entry) return null;
          return (
            <div key={day} className="flex justify-between gap-4">
              <span className="text-muted-foreground w-8">{DAY_LABELS[day]}</span>
              {entry.isClosed ? (
                <span className="text-muted-foreground">Closed</span>
              ) : (
                <span>
                  {entry.open} – {entry.close}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SocialRow({ social }: { social: SocialLinks }) {
  const links = [
    { key: 'facebook', icon: Facebook, label: 'Facebook', href: social.facebook },
    { key: 'instagram', icon: Instagram, label: 'Instagram', href: social.instagram },
    { key: 'twitter', icon: Twitter, label: 'Twitter / X', href: social.twitter },
    { key: 'linkedin', icon: Linkedin, label: 'LinkedIn', href: social.linkedin },
  ].filter((l) => l.href);
  if (!links.length) return null;
  return (
    <div>
      <p className="text-xs text-muted-foreground font-medium mb-2">Social media</p>
      <div className="flex flex-wrap gap-2">
        {links.map(({ key, icon: Icon, label, href }) => (
          <a
            key={key}
            href={href!}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
          >
            <Icon className="h-4 w-4" />
            {label}
          </a>
        ))}
      </div>
    </div>
  );
}

function TagList({ label, items }: { label: string; items?: string[] }) {
  if (!items || !items.length) return null;
  return (
    <div>
      <p className="text-xs text-muted-foreground font-medium mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1">
        {items.map((item) => (
          <Badge key={item} variant="outline" className="text-xs">
            {item}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function BookingLink({ url, label = 'Book now' }: { url?: string | null; label?: string }) {
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
    >
      <ExternalLink className="h-3.5 w-3.5" />
      {label}
    </a>
  );
}

function RestaurantDetails({ data }: { data: Restaurant }) {
  const allImages = [...(data.menuImages ?? []), ...(data.dishImages ?? [])];
  console.log('allImages', allImages);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Utensils className="h-4 w-4" /> Restaurant details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <TagList label="Cuisine types" items={data.cuisineTypes} />
        <TagList label="Dining options" items={data.diningOptions} />
        <TagList label="Dietary options" items={data.dietaryOptions} />
        {data.specialDishes && data.specialDishes.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-2">Special dishes</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data.specialDishes.map((dish) => (
                <div key={dish.id} className="flex gap-3 text-sm">
                  {dish.file?.url && (
                    <div className="relative h-14 w-14 flex-shrink-0 rounded-md overflow-hidden">
                      <Image
                        src={dish.file.url}
                        alt={dish.title ?? ''}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div>
                    {dish.title && <p className="font-medium">{dish.title}</p>}
                    {dish.description && (
                      <p className="text-muted-foreground text-xs">{dish.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {allImages.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-2">Menu & dish photos</p>
            <div className="flex flex-wrap gap-2">
              {allImages.map((img) => (
                <div key={img.id} className="relative h-20 w-20 rounded-md overflow-hidden">
                  <Image src={img.url} alt="" fill className="object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AccommodationDetails({ data }: { data: Accommodation }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <BedDouble className="h-4 w-4" /> Accommodation details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-4">
          {data.checkInTime && (
            <div>
              <p className="text-xs text-muted-foreground">Check-in</p>
              <p>{data.checkInTime}</p>
            </div>
          )}
          {data.checkOutTime && (
            <div>
              <p className="text-xs text-muted-foreground">Check-out</p>
              <p>{data.checkOutTime}</p>
            </div>
          )}
          {data.petsAllowed != null && (
            <div>
              <p className="text-xs text-muted-foreground">Pets</p>
              <p>{data.petsAllowed ? 'Allowed' : 'Not allowed'}</p>
            </div>
          )}
          {data.ageRestriction && (
            <div>
              <p className="text-xs text-muted-foreground">Age restriction</p>
              <p>{data.ageRestriction}</p>
            </div>
          )}
        </div>
        <BookingLink url={data.bookingUrl} />
        {data.roomTypes && data.roomTypes.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-2">Room types</p>
            <div className="space-y-2">
              {data.roomTypes.map((room, i) => (
                <div key={i} className="rounded-md border px-3 py-2">
                  <p className="font-medium">{room.name}</p>
                  <p className="text-xs text-muted-foreground">Capacity: {room.capacity}</p>
                  {room.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{room.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ShoppingDetails({ data }: { data: Shopping }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ShoppingBag className="h-4 w-4" /> Shopping details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <TagList label="Product categories" items={data.productCategories} />
        <TagList label="Brands carried" items={data.brandsCarried} />
        {data.returnPolicy && (
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">Return policy</p>
            <p className="text-muted-foreground">{data.returnPolicy}</p>
          </div>
        )}
        <div className="flex flex-wrap gap-3">
          <BookingLink url={data.bookingUrl} />
          <BookingLink url={data.onlineStoreUrl} label="Online store" />
        </div>
      </CardContent>
    </Card>
  );
}

function TransportDetails({ data }: { data: Transport }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Bus className="h-4 w-4" /> Transport details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {data.operator && (
          <div>
            <p className="text-xs text-muted-foreground">Operator</p>
            <p>{data.operator}</p>
          </div>
        )}
        <TagList label="Transport lines" items={data.transportLines} />
        <TagList label="Destinations" items={data.destinations} />
        <TagList label="Vehicle types" items={data.vehicleTypes} />
        {data.rentalOptions && Object.keys(data.rentalOptions).length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1.5">Rental pricing</p>
            <div className="grid grid-cols-2 gap-2">
              {data.rentalOptions.perHour != null && (
                <div>
                  <span className="text-muted-foreground">Per hour: </span>$
                  {data.rentalOptions.perHour}
                </div>
              )}
              {data.rentalOptions.perDay != null && (
                <div>
                  <span className="text-muted-foreground">Per day: </span>$
                  {data.rentalOptions.perDay}
                </div>
              )}
              {data.rentalOptions.perWeek != null && (
                <div>
                  <span className="text-muted-foreground">Per week: </span>$
                  {data.rentalOptions.perWeek}
                </div>
              )}
              {data.rentalOptions.perMonth != null && (
                <div>
                  <span className="text-muted-foreground">Per month: </span>$
                  {data.rentalOptions.perMonth}
                </div>
              )}
            </div>
          </div>
        )}
        <BookingLink url={data.bookingUrl} />
      </CardContent>
    </Card>
  );
}

function HealthWellnessDetails({ data }: { data: HealthWellness }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4" /> Health & Wellness details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <TagList label="Services offered" items={data.servicesOffered} />
        {data.practitioners && data.practitioners.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-2">Practitioners</p>
            <div className="space-y-2">
              {data.practitioners.map((p, i) => (
                <div key={i} className="rounded-md border px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="font-medium">{p.name}</p>
                  </div>
                  {p.specialty && <p className="text-xs text-muted-foreground">{p.specialty}</p>}
                  {p.qualifications && (
                    <p className="text-xs text-muted-foreground">{p.qualifications}</p>
                  )}
                  {p.yearsOfExperience != null && (
                    <p className="text-xs text-muted-foreground">
                      {p.yearsOfExperience} years experience
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="flex flex-wrap gap-3">
          <BookingLink url={data.appointmentBookingUrl} label="Book appointment" />
          <BookingLink url={data.bookingUrl} />
        </div>
      </CardContent>
    </Card>
  );
}

function NatureOutdoorsDetails({ data }: { data: NatureOutdoors }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <TreePine className="h-4 w-4" /> Nature & Outdoors details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {data.entryFee && (
          <div>
            <p className="text-xs text-muted-foreground">Entry fee</p>
            <p>{data.entryFee}</p>
          </div>
        )}
        {data.bestTimeToVisit && (
          <div>
            <p className="text-xs text-muted-foreground">Best time to visit</p>
            <p>{data.bestTimeToVisit}</p>
          </div>
        )}
        <TagList label="Key activities" items={data.keyActivities} />
        <TagList label="Key exhibits" items={data.keyExhibits} />
        <TagList label="Rules" items={data.rules} />
      </CardContent>
    </Card>
  );
}

function EntertainmentDetails({ data }: { data: Entertainment }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Ticket className="h-4 w-4" /> Entertainment details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {data.ageRestriction && (
          <div>
            <p className="text-xs text-muted-foreground">Age restriction</p>
            <p>{data.ageRestriction}</p>
          </div>
        )}
        {data.eventSchedule && (
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">Event schedule</p>
            <p className="text-muted-foreground whitespace-pre-wrap">{data.eventSchedule}</p>
          </div>
        )}
        {data.ticketPrice && Object.keys(data.ticketPrice).length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1.5">Ticket prices</p>
            <div className="grid grid-cols-2 gap-1">
              {Object.entries(data.ticketPrice).map(([k, v]) => (
                <div key={k}>
                  <span className="capitalize text-muted-foreground">{k}: </span>${String(v)}
                </div>
              ))}
            </div>
          </div>
        )}
        <TagList label="Current exhibits" items={data.currentExhibits} />
        <BookingLink url={data.ticketBookingUrl} label="Buy tickets" />
      </CardContent>
    </Card>
  );
}

// ─── Gallery Modal ─────────────────────────────────────────────────────────────

function GalleryModal({
  images,
  initialIndex,
  open,
  onOpenChange,
}: {
  images: FileEntity[];
  initialIndex: number;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [current, setCurrent] = useState(initialIndex);

  const prev = useCallback(
    () => setCurrent((c) => (c - 1 + images.length) % images.length),
    [images.length],
  );
  const next = useCallback(() => setCurrent((c) => (c + 1) % images.length), [images.length]);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black border-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Image gallery</DialogTitle>
          <DialogDescription>Browse all place images</DialogDescription>
        </DialogHeader>
        <div className="relative flex items-center justify-center min-h-[60vh]">
          <div className="w-full flex items-center justify-center" style={{ minHeight: '60vh' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[current].url}
              alt={`Photo ${current + 1}`}
              className="max-w-full max-h-[70vh] object-contain"
            />
          </div>
          {images.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={next}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white/70 text-xs bg-black/40 px-2 py-1 rounded-full">
            {current + 1} / {images.length}
          </div>
        </div>
        {images.length > 1 && (
          <div className="flex gap-1.5 p-3 overflow-x-auto bg-black/80">
            {images.map((img, i) => (
              <button
                key={img.id}
                onClick={() => setCurrent(i)}
                className={`relative flex-shrink-0 h-14 w-14 rounded overflow-hidden border-2 transition-colors ${
                  i === current ? 'border-white' : 'border-transparent opacity-60 hover:opacity-90'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" className="object-cover w-full h-full" />
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Places Search Panel ───────────────────────────────────────────────────────

function PlacesSearchPanel({ currentId }: { currentId: number }) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [query]);

  const { data, isLoading } = usePlaces({
    search: debouncedQuery || undefined,
    page,
    limit: 10,
    enabled: !!debouncedQuery,
  });

  const places = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Search className="h-4 w-4" /> Search Places
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by name, address, category, city…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {!debouncedQuery ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Type to search all places.
          </p>
        ) : isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
        ) : places.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No places match your search.
          </p>
        ) : (
          <div className="space-y-1">
            {places.map((p) => (
              <Link
                key={p.id}
                href={`/places/${p.id}`}
                className={`flex items-center gap-3 p-2.5 rounded-lg border hover:bg-muted/50 transition-colors ${p.id === currentId ? 'border-primary/40 bg-primary/5' : ''}`}
              >
                <div className="h-10 w-10 rounded-md overflow-hidden bg-muted flex-shrink-0">
                  {p.images?.[0]?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.images[0].url}
                      alt={p.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    {p.id === currentId && (
                      <Badge variant="outline" className="text-xs shrink-0">
                        current
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {[p.category?.name, p.city?.name, p.country?.name].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <div className="shrink-0">
                  {p.isVerified === true ? (
                    <Badge variant="success" className="text-xs">
                      Approved
                    </Badge>
                  ) : p.isVerified === false ? (
                    <Badge variant="destructive" className="text-xs">
                      Rejected
                    </Badge>
                  ) : (
                    <Badge variant="warning" className="text-xs">
                      Pending
                    </Badge>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-muted-foreground">
              Page {page} of {totalPages}
              {data?.total ? ` · ${data.total} total` : ''}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function PlaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const { data: place, isLoading } = usePlace(Number(id));
  const approve = useApprovePlace();
  const reject = useRejectPlace();

  const moderationEntriesNewestFirst = useMemo(
    () => (place?.moderationHistory?.length ? [...place.moderationHistory].reverse() : []),
    [place?.moderationHistory],
  );

  const { data: reviews, isLoading: reviewsLoading } = useQuery({
    queryKey: ['place-reviews', id],
    queryFn: async () => {
      const { data } = await api.get<{ data: PlaceReview[] }>(`/places/${id}/reviews`);
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
    reject.mutate({ id: Number(id), reason: rejectReason });
    setRejectOpen(false);
    setRejectReason('');
  };

  const categoryDetail = place
    ? (place.restaurant ??
      place.accommodation ??
      place.shopping ??
      place.transport ??
      place.healthWellness ??
      place.natureOutdoors ??
      place.entertainment)
    : null;

  const hasInfo =
    place &&
    (place.address ||
      place.phone ||
      place.email ||
      place.website ||
      place.description ||
      place.openingHours ||
      place.social ||
      place.priceType ||
      (place.facilities && place.facilities.length > 0) ||
      (place.tags && place.tags.length > 0));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (!place) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Place not found.</p>
        <Button variant="link" onClick={() => router.back()}>
          Go back
        </Button>
      </div>
    );
  }

  const images = place.images ?? [];
  console.log('images', images);
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{place.name}</h1>
              {place.isFeatured && <Badge variant="secondary">Featured</Badge>}
            </div>
            <p className="text-muted-foreground text-sm">{place.slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {place.isVerified === true ? (
            <>
              <Badge variant="success">Approved</Badge>
              <Button size="sm" variant="destructive" onClick={() => setRejectOpen(true)}>
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
            </>
          ) : place.isVerified === false ? (
            <>
              <Badge variant="destructive">Rejected</Badge>
              <Button
                size="sm"
                onClick={() => approve.mutate(place.id)}
                disabled={approve.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Re-approve
              </Button>
            </>
          ) : (
            <>
              <Badge variant="warning">Pending</Badge>
              <Button
                size="sm"
                onClick={() => approve.mutate(place.id)}
                disabled={approve.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve
              </Button>
              <Button size="sm" variant="destructive" onClick={() => setRejectOpen(true)}>
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
            </>
          )}
        </div>
      </div>

      {place.isVerified === false && place.rejectionReason ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
          <p className="font-medium text-destructive">Rejection reason</p>
          <p className="text-muted-foreground mt-1 whitespace-pre-wrap">{place.rejectionReason}</p>
        </div>
      ) : null}

      {/* Image gallery grid */}
      {images.length > 0 && (
        <div className="relative">
          <div className="grid grid-cols-3 gap-2 rounded-xl overflow-hidden h-72">
            <button
              type="button"
              className={
                images.length === 1
                  ? 'col-span-3 relative w-full h-full cursor-pointer group'
                  : 'col-span-2 row-span-2 relative cursor-pointer group h-full'
              }
              onClick={() => openGallery(0)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images[0].url}
                alt={place.name}
                className="object-cover w-full h-full transition-transform group-hover:scale-105"
              />
            </button>
            {images.slice(1, 3).map((img: FileEntity, i: number) => (
              <button
                key={img.id}
                className="relative cursor-pointer group overflow-hidden"
                onClick={() => openGallery(i + 1)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={place.name}
                  className="object-cover w-full h-full transition-transform group-hover:scale-105"
                />
                {i === 1 && images.length > 3 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-white text-center">
                      <Images className="h-5 w-5 mx-auto mb-1" />
                      <span className="text-sm font-medium">+{images.length - 3} more</span>
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
          {images.length > 0 && (
            <button
              onClick={() => openGallery(0)}
              className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-md bg-white/90 dark:bg-black/70 px-3 py-1.5 text-xs font-medium shadow hover:bg-white dark:hover:bg-black/90 transition-colors"
            >
              <Images className="h-3.5 w-3.5" />
              View all {images.length} photo{images.length !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="sm:col-span-2">
          {place.user?.id ? (
            <Link href={`/users/${place.user.id}`} className="block h-full">
              <CardContent className="p-4 flex items-center gap-3 h-full hover:bg-muted/40 transition-colors">
                {place.user.profileImage?.url ? (
                  <Image
                    src={place.user.profileImage.url}
                    alt={place.user.fullName || place.user.email || 'User avatar'}
                    width={44}
                    height={44}
                    className="h-11 w-11 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-11 w-11 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground">
                    {(place.user.fullName || place.user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Creator</p>
                  <p className="font-semibold truncate">
                    {place.user.fullName || `User #${place.user.id}`}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {place.user.email || '—'}
                  </p>
                </div>
              </CardContent>
            </Link>
          ) : (
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground">
                —
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Creator</p>
                <p className="font-semibold">—</p>
                <p className="text-sm text-muted-foreground">—</p>
              </div>
            </CardContent>
          )}
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            <div>
              <p className="text-xs text-muted-foreground">Rating</p>
              <p className="font-semibold">
                {place.averageRating != null ? Number(place.averageRating).toFixed(1) : '—'} (
                {place.reviewCount})
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Eye className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-xs text-muted-foreground">Views</p>
              <p className="font-semibold">{place.viewCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Heart className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-xs text-muted-foreground">Favorites</p>
              <p className="font-semibold">{place.favoriteCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Calendar className="h-5 w-5 text-purple-500" />
            <div>
              <p className="text-xs text-muted-foreground">Created</p>
              <p className="font-semibold">{formatDate(place.createdAt)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="reviews">
        <TabsList>
          <TabsTrigger value="reviews">Reviews ({place.reviewCount ?? 0})</TabsTrigger>
          <TabsTrigger value="moderation">Moderation</TabsTrigger>
          <TabsTrigger value="info">Info</TabsTrigger>
          {categoryDetail && <TabsTrigger value="category">Category details</TabsTrigger>}
        </TabsList>

        {/* Reviews tab */}
        <TabsContent value="reviews" className="mt-4">
          <div className="space-y-3">
            {reviewsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))
            ) : reviews && reviews.length > 0 ? (
              reviews.map((review: PlaceReview) => (
                <Card key={review.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm">
                            {review.user?.fullName ?? 'Anonymous'}
                          </p>
                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`}
                              />
                            ))}
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-muted-foreground">{review.comment}</p>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground flex-shrink-0">
                        {formatDate(review.createdAt)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  No reviews yet.
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Moderation tab */}
        <TabsContent value="moderation" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-4 w-4" /> Moderation history
              </CardTitle>
            </CardHeader>
            <CardContent>
              {moderationEntriesNewestFirst.length > 0 ? (
                <ul className="space-y-4 border-l-2 border-muted ml-1.5 pl-5">
                  {moderationEntriesNewestFirst.map((entry: PlaceModerationHistoryItem) => (
                    <li key={entry.id} className="text-sm relative">
                      <span className="absolute -left-[1.15rem] top-1.5 h-2 w-2 rounded-full bg-muted-foreground/40" />
                      <p className="font-medium">{moderationEventTitle(entry.eventType)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(entry.createdAt)}
                        {entry.actor?.fullName || entry.actor?.email
                          ? ` · ${entry.actor?.fullName ?? entry.actor?.email ?? ''}`
                          : null}
                      </p>
                      {entry.eventType === 'rejected' && entry.reason && (
                        <p className="text-muted-foreground mt-2 whitespace-pre-wrap rounded-md bg-muted/50 px-3 py-2 text-xs">
                          {entry.reason}
                        </p>
                      )}
                      {entry.eventType === 'resubmitted' && entry.reason && (
                        <div className="mt-2 rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs">
                          <p className="font-medium text-amber-900 dark:text-amber-200">
                            Admin feedback at time of re-submit
                          </p>
                          <p className="text-muted-foreground mt-1 whitespace-pre-wrap">
                            {entry.reason}
                          </p>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No recorded events yet. Submissions and review actions are logged from when this
                  feature is deployed; run the latest migration and new activity will appear here.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Info tab */}
        <TabsContent value="info" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {(place.address || place.city || place.state || place.country) && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <span>
                      {[
                        place.address,
                        place.postalCode,
                        place.city?.name,
                        place.state?.name,
                        place.country?.name,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </span>
                  </div>
                )}
                {place.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span>{place.phone}</span>
                  </div>
                )}
                {place.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span>{place.email}</span>
                  </div>
                )}
                {place.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <a
                      href={place.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline truncate"
                    >
                      {place.website}
                    </a>
                  </div>
                )}
              </div>

              {place.latitude != null && place.longitude != null && (
                <div className="text-xs text-muted-foreground">
                  Coordinates: {Number(place.latitude).toFixed(6)},{' '}
                  {Number(place.longitude).toFixed(6)}
                </div>
              )}

              <PriceDisplay place={place} />

              {place.openingHours && (
                <OpeningHoursTable hours={place.openingHours} openFullDay={place.openFullDay} />
              )}
              {!place.openingHours && place.openFullDay && (
                <OpeningHoursTable hours={{}} openFullDay />
              )}

              {place.social && <SocialRow social={place.social} />}

              {place.description && (
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-1">Description</p>
                  <p className="text-sm leading-relaxed">{place.description}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Category</p>
                  <Badge variant="outline">{place.category?.name ?? '—'}</Badge>
                </div>
                {place.subcategory && (
                  <div>
                    <p className="text-xs text-muted-foreground">Subcategory</p>
                    <Badge variant="outline">{place.subcategory.name}</Badge>
                  </div>
                )}
              </div>

              {place.tags && place.tags.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-2">Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {place.tags.map((tag: Tag) => (
                      <Badge key={tag.id} variant="outline" className="text-xs">
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {place.facilities && place.facilities.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-2">
                    <Wifi className="h-3.5 w-3.5 inline mr-1" />
                    Facilities
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {place.facilities.map((f: Facility) => (
                      <Badge key={f.id} variant="secondary" className="text-xs">
                        {f.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Place ID</p>
                  <p className="font-medium">#{place.id}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Active</p>
                  <Badge
                    variant={place.isActive ? 'success' : 'secondary'}
                    className="text-xs mt-0.5"
                  >
                    {place.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Featured</p>
                  <Badge
                    variant={place.isFeatured ? 'secondary' : 'outline'}
                    className="text-xs mt-0.5"
                  >
                    {place.isFeatured ? 'Featured' : 'Not featured'}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Last updated</p>
                  <p className="text-xs">{formatDate(place.updatedAt)}</p>
                </div>
              </div>

              {!hasInfo && (
                <p className="text-sm text-muted-foreground">No additional info available.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Category-specific details tab */}
        {categoryDetail && (
          <TabsContent value="category" className="mt-4">
            {place.restaurant && <RestaurantDetails data={place.restaurant} />}
            {place.accommodation && <AccommodationDetails data={place.accommodation} />}
            {place.shopping && <ShoppingDetails data={place.shopping} />}
            {place.transport && <TransportDetails data={place.transport} />}
            {place.healthWellness && <HealthWellnessDetails data={place.healthWellness} />}
            {place.natureOutdoors && <NatureOutdoorsDetails data={place.natureOutdoors} />}
            {place.entertainment && <EntertainmentDetails data={place.entertainment} />}
          </TabsContent>
        )}
      </Tabs>

      {/* Places search */}
      <PlacesSearchPanel currentId={place.id} />

      {/* Gallery modal */}
      {images.length > 0 && (
        <GalleryModal
          images={images}
          initialIndex={galleryIndex}
          open={galleryOpen}
          onOpenChange={setGalleryOpen}
        />
      )}

      {/* Reject dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Place</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting &quot;{place.name}&quot;.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Rejection Reason</Label>
            <Textarea
              placeholder="Describe why this place is being rejected..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectReason.trim() || reject.isPending}
            >
              Reject Place
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
