'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Loader2, MapPin, Plus, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCategories, useCategory } from '@/hooks/use-categories';
import { useAdminLocationTree } from '@/hooks/use-admin-locations';
import { useTags } from '@/hooks/use-tags';
import { useUploadFile } from '@/hooks/use-files';
import { useCreatePlace } from '@/hooks/use-places';
import { useFacilities } from '@/hooks/use-facilities';
import type { AdminLocationNode, FileEntity } from '@/types';
import api from '@/lib/api';

// ─── Types ─────────────────────────────────────────────────────────────────

interface DayHours {
  open: string;
  close: string;
  isClosed: boolean;
}

const DAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;
type Day = (typeof DAYS)[number];

const defaultDay: DayHours = { open: '09:00', close: '18:00', isClosed: false };

const defaultOpeningHours: Record<Day, DayHours> = {
  monday: { ...defaultDay },
  tuesday: { ...defaultDay },
  wednesday: { ...defaultDay },
  thursday: { ...defaultDay },
  friday: { ...defaultDay },
  saturday: { ...defaultDay },
  sunday: { isClosed: true, open: '09:00', close: '18:00' },
};

interface SpecialDish {
  title: string;
  description: string;
}

interface RoomType {
  name: string;
  description: string;
  capacity: string;
}

interface Practitioner {
  name: string;
  specialty: string;
  qualifications: string;
  yearsOfExperience: string;
}

interface TicketPriceEntry {
  key: string;
  value: string;
}

interface FormState {
  name: string;
  description: string;
  slug: string;
  categoryId: string;
  subcategoryId: string;
  countryId: string;
  stateId: string;
  cityId: string;
  address: string;
  postalCode: string;
  latitude: string;
  longitude: string;
  phone: string;
  email: string;
  website: string;
  openFullDay: boolean;
  openingHours: Record<Day, DayHours>;
  social: { facebook: string; instagram: string; twitter: string; linkedin: string };
  priceType: string;
  price: string;
  minPrice: string;
  maxPrice: string;
  oldPrice: string;
  isPriceOnRequest: boolean;
  imageIds: number[];
  tagIds: number[];
  facilityIds: number[];
  // Category-specific
  restaurantData: {
    cuisineTypes: string[];
    diningOptions: string[];
    dietaryOptions: string[];
    specialDishes: SpecialDish[];
  };
  accommodationData: {
    roomTypes: RoomType[];
    bookingUrl: string;
    checkInTime: string;
    checkOutTime: string;
    petsAllowed: boolean;
    ageRestriction: string;
  };
  entertainmentData: {
    eventSchedule: string;
    ticketPriceEntries: TicketPriceEntry[];
    ticketBookingUrl: string;
    currentExhibits: string[];
    ageRestriction: string;
  };
  shoppingData: {
    productCategories: string[];
    brandsCarried: string[];
    onlineStoreUrl: string;
    returnPolicy: string;
    bookingUrl: string;
  };
  transportData: {
    operator: string;
    transportLines: string[];
    destinations: string[];
    vehicleTypes: string[];
    rentalOptions: { perHour: string; perDay: string; perWeek: string; perMonth: string };
    bookingUrl: string;
  };
  healthWellnessData: {
    servicesOffered: string[];
    appointmentBookingUrl: string;
    insuranceAccepted: boolean;
    practitioners: Practitioner[];
    membershipOptions: {
      monthly: string;
      yearly: string;
      weekly: string;
      dayPass: string;
      trialPeriod: string;
      features: string[];
    };
    bookingUrl: string;
  };
  natureOutdoorsData: {
    entryFee: string;
    keyActivities: string[];
    rules: string[];
    bestTimeToVisit: string;
    keyExhibits: string[];
  };
}

const initialForm: FormState = {
  name: '',
  description: '',
  slug: '',
  categoryId: '',
  subcategoryId: '',
  countryId: '',
  stateId: '',
  cityId: '',
  address: '',
  postalCode: '',
  latitude: '',
  longitude: '',
  phone: '',
  email: '',
  website: '',
  openFullDay: false,
  openingHours: defaultOpeningHours,
  social: { facebook: '', instagram: '', twitter: '', linkedin: '' },
  priceType: '',
  price: '',
  minPrice: '',
  maxPrice: '',
  oldPrice: '',
  isPriceOnRequest: false,
  imageIds: [],
  tagIds: [],
  facilityIds: [],
  restaurantData: { cuisineTypes: [], diningOptions: [], dietaryOptions: [], specialDishes: [] },
  accommodationData: {
    roomTypes: [],
    bookingUrl: '',
    checkInTime: '',
    checkOutTime: '',
    petsAllowed: false,
    ageRestriction: '',
  },
  entertainmentData: {
    eventSchedule: '',
    ticketPriceEntries: [],
    ticketBookingUrl: '',
    currentExhibits: [],
    ageRestriction: '',
  },
  shoppingData: {
    productCategories: [],
    brandsCarried: [],
    onlineStoreUrl: '',
    returnPolicy: '',
    bookingUrl: '',
  },
  transportData: {
    operator: '',
    transportLines: [],
    destinations: [],
    vehicleTypes: [],
    rentalOptions: { perHour: '', perDay: '', perWeek: '', perMonth: '' },
    bookingUrl: '',
  },
  healthWellnessData: {
    servicesOffered: [],
    appointmentBookingUrl: '',
    insuranceAccepted: false,
    practitioners: [],
    membershipOptions: {
      monthly: '',
      yearly: '',
      weekly: '',
      dayPass: '',
      trialPeriod: '',
      features: [],
    },
    bookingUrl: '',
  },
  natureOutdoorsData: {
    entryFee: '',
    keyActivities: [],
    rules: [],
    bestTimeToVisit: '',
    keyExhibits: [],
  },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function num(s: string): number | undefined {
  const n = parseFloat(s);
  return isNaN(n) ? undefined : n;
}

function buildPayload(form: FormState, categorySlug: string | null | undefined) {
  const payload: Record<string, unknown> = { name: form.name };

  if (form.description) payload.description = form.description;
  if (form.slug) payload.slug = form.slug;
  if (form.address) payload.address = form.address;
  if (form.postalCode) payload.postalCode = form.postalCode;
  if (form.phone) payload.phone = form.phone;
  if (form.email) payload.email = form.email;
  if (form.website) payload.website = form.website;
  if (form.countryId) payload.countryId = Number(form.countryId);
  if (form.stateId) payload.stateId = Number(form.stateId);
  if (form.cityId) payload.cityId = Number(form.cityId);
  if (form.latitude) payload.latitude = parseFloat(form.latitude);
  if (form.longitude) payload.longitude = parseFloat(form.longitude);

  payload.categoryId = Number(form.categoryId);
  if (form.subcategoryId) payload.subcategoryId = Number(form.subcategoryId);

  if (form.imageIds.length) payload.imageIds = form.imageIds;
  payload.openFullDay = form.openFullDay;
  if (!form.openFullDay) payload.openingHours = form.openingHours;

  const social = Object.fromEntries(Object.entries(form.social).filter(([, v]) => v));
  if (Object.keys(social).length) payload.social = social;

  if (form.priceType) payload.priceType = form.priceType;
  if (form.isPriceOnRequest) payload.isPriceOnRequest = true;
  if (form.price) payload.price = num(form.price);
  if (form.minPrice) payload.minPrice = num(form.minPrice);
  if (form.maxPrice) payload.maxPrice = num(form.maxPrice);
  if (form.oldPrice) payload.oldPrice = num(form.oldPrice);

  if (form.tagIds.length) payload.tagIds = form.tagIds;
  if (form.facilityIds.length) payload.facilityIds = form.facilityIds;

  switch (categorySlug) {
    case 'food-and-drink': {
      const d = form.restaurantData;
      const r: Record<string, unknown> = {};
      if (d.cuisineTypes.length) r.cuisineTypes = d.cuisineTypes;
      if (d.diningOptions.length) r.diningOptions = d.diningOptions;
      if (d.dietaryOptions.length) r.dietaryOptions = d.dietaryOptions;
      if (d.specialDishes.length) r.specialDishes = d.specialDishes;
      if (Object.keys(r).length) payload.restaurantData = r;
      break;
    }
    case 'accommodation': {
      const d = form.accommodationData;
      const a: Record<string, unknown> = {};
      if (d.roomTypes.length)
        a.roomTypes = d.roomTypes.map((rt) => ({
          name: rt.name,
          description: rt.description || undefined,
          capacity: parseInt(rt.capacity) || 1,
        }));
      if (d.bookingUrl) a.bookingUrl = d.bookingUrl;
      if (d.checkInTime) a.checkInTime = d.checkInTime;
      if (d.checkOutTime) a.checkOutTime = d.checkOutTime;
      a.petsAllowed = d.petsAllowed;
      if (d.ageRestriction) a.ageRestriction = d.ageRestriction;
      if (Object.keys(a).length) payload.accommodationData = a;
      break;
    }
    case 'entertainment': {
      const d = form.entertainmentData;
      const e: Record<string, unknown> = {};
      if (d.eventSchedule) e.eventSchedule = d.eventSchedule;
      const tp = Object.fromEntries(
        d.ticketPriceEntries.filter((x) => x.key && x.value).map((x) => [x.key, x.value]),
      );
      if (Object.keys(tp).length) e.ticketPrice = tp;
      if (d.ticketBookingUrl) e.ticketBookingUrl = d.ticketBookingUrl;
      if (d.currentExhibits.length) e.currentExhibits = d.currentExhibits;
      if (d.ageRestriction) e.ageRestriction = d.ageRestriction;
      if (Object.keys(e).length) payload.entertainmentData = e;
      break;
    }
    case 'shopping': {
      const d = form.shoppingData;
      const s: Record<string, unknown> = {};
      if (d.productCategories.length) s.productCategories = d.productCategories;
      if (d.brandsCarried.length) s.brandsCarried = d.brandsCarried;
      if (d.onlineStoreUrl) s.onlineStoreUrl = d.onlineStoreUrl;
      if (d.returnPolicy) s.returnPolicy = d.returnPolicy;
      if (d.bookingUrl) s.bookingUrl = d.bookingUrl;
      if (Object.keys(s).length) payload.shoppingData = s;
      break;
    }
    case 'transport': {
      const d = form.transportData;
      const t: Record<string, unknown> = {};
      if (d.operator) t.operator = d.operator;
      if (d.transportLines.length) t.transportLines = d.transportLines;
      if (d.destinations.length) t.destinations = d.destinations;
      if (d.vehicleTypes.length) t.vehicleTypes = d.vehicleTypes;
      const ro = Object.fromEntries(
        Object.entries(d.rentalOptions)
          .filter(([, v]) => v)
          .map(([k, v]) => [k, num(v)]),
      );
      if (Object.keys(ro).length) t.rentalOptions = ro;
      if (d.bookingUrl) t.bookingUrl = d.bookingUrl;
      if (Object.keys(t).length) payload.transportData = t;
      break;
    }
    case 'health-and-wellness': {
      const d = form.healthWellnessData;
      const h: Record<string, unknown> = {};
      if (d.servicesOffered.length) h.servicesOffered = d.servicesOffered;
      if (d.appointmentBookingUrl) h.appointmentBookingUrl = d.appointmentBookingUrl;
      h.insuranceAccepted = d.insuranceAccepted;
      if (d.practitioners.length)
        h.practitioners = d.practitioners.map((p) => ({
          name: p.name,
          specialty: p.specialty || undefined,
          qualifications: p.qualifications || undefined,
          yearsOfExperience: p.yearsOfExperience ? parseInt(p.yearsOfExperience) : undefined,
        }));
      const mo = form.healthWellnessData.membershipOptions;
      const moClean: Record<string, unknown> = {};
      if (mo.monthly) moClean.monthly = num(mo.monthly);
      if (mo.yearly) moClean.yearly = num(mo.yearly);
      if (mo.weekly) moClean.weekly = num(mo.weekly);
      if (mo.dayPass) moClean.dayPass = num(mo.dayPass);
      if (mo.trialPeriod) moClean.trialPeriod = mo.trialPeriod;
      if (mo.features.length) moClean.features = mo.features;
      if (Object.keys(moClean).length) h.membershipOptions = moClean;
      if (d.bookingUrl) h.bookingUrl = d.bookingUrl;
      if (Object.keys(h).length) payload.healthWellnessData = h;
      break;
    }
    case 'nature-and-outdoors': {
      const d = form.natureOutdoorsData;
      const n: Record<string, unknown> = {};
      if (d.entryFee) n.entryFee = d.entryFee;
      if (d.keyActivities.length) n.keyActivities = d.keyActivities;
      if (d.rules.length) n.rules = d.rules;
      if (d.bestTimeToVisit) n.bestTimeToVisit = d.bestTimeToVisit;
      if (d.keyExhibits.length) n.keyExhibits = d.keyExhibits;
      if (Object.keys(n).length) payload.natureOutdoorsData = n;
      break;
    }
  }

  return payload;
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function ArrayChipInput({
  label,
  placeholder,
  items,
  onAdd,
  onRemove,
}: {
  label: string;
  placeholder: string;
  items: string[];
  onAdd: (val: string) => void;
  onRemove: (idx: number) => void;
}) {
  const [val, setVal] = useState('');
  const add = () => {
    const t = val.trim();
    if (t && !items.includes(t)) {
      onAdd(t);
      setVal('');
    }
  };
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          value={val}
          placeholder={placeholder}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button type="button" variant="outline" size="icon" onClick={add}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1">
          {items.map((item, i) => (
            <Badge key={i} variant="secondary" className="gap-1 pr-1 text-xs">
              {item}
              <button type="button" onClick={() => onRemove(i)}>
                <X className="h-3 w-3 hover:text-destructive" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

// ─── Category-specific forms ─────────────────────────────────────────────────

function RestaurantSection({
  form,
  setForm,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
}) {
  const d = form.restaurantData;
  const update = (patch: Partial<FormState['restaurantData']>) =>
    setForm((f) => ({ ...f, restaurantData: { ...f.restaurantData, ...patch } }));

  const [dish, setDish] = useState<SpecialDish>({ title: '', description: '' });

  return (
    <SectionCard title="Restaurant Details">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ArrayChipInput
          label="Cuisine Types"
          placeholder="e.g. Italian"
          items={d.cuisineTypes}
          onAdd={(v) => update({ cuisineTypes: [...d.cuisineTypes, v] })}
          onRemove={(i) => update({ cuisineTypes: d.cuisineTypes.filter((_, idx) => idx !== i) })}
        />
        <ArrayChipInput
          label="Dining Options"
          placeholder="e.g. Dine-in"
          items={d.diningOptions}
          onAdd={(v) => update({ diningOptions: [...d.diningOptions, v] })}
          onRemove={(i) => update({ diningOptions: d.diningOptions.filter((_, idx) => idx !== i) })}
        />
        <ArrayChipInput
          label="Dietary Options"
          placeholder="e.g. Vegan"
          items={d.dietaryOptions}
          onAdd={(v) => update({ dietaryOptions: [...d.dietaryOptions, v] })}
          onRemove={(i) =>
            update({ dietaryOptions: d.dietaryOptions.filter((_, idx) => idx !== i) })
          }
        />
      </div>

      <Separator />
      <div className="space-y-3">
        <Label className="text-sm font-medium">Special Dishes</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <Input
            placeholder="Dish name"
            value={dish.title}
            onChange={(e) => setDish((d) => ({ ...d, title: e.target.value }))}
          />
          <div className="flex gap-2">
            <Input
              placeholder="Description"
              value={dish.description}
              onChange={(e) => setDish((d) => ({ ...d, description: e.target.value }))}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => {
                if (dish.title) {
                  update({ specialDishes: [...d.specialDishes, dish] });
                  setDish({ title: '', description: '' });
                }
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {d.specialDishes.map((dish, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
          >
            <div>
              <span className="font-medium">{dish.title}</span>
              {dish.description && (
                <span className="ml-2 text-muted-foreground">{dish.description}</span>
              )}
            </div>
            <button
              type="button"
              onClick={() =>
                update({ specialDishes: d.specialDishes.filter((_, idx) => idx !== i) })
              }
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
            </button>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function AccommodationSection({
  form,
  setForm,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
}) {
  const d = form.accommodationData;
  const update = (patch: Partial<FormState['accommodationData']>) =>
    setForm((f) => ({ ...f, accommodationData: { ...f.accommodationData, ...patch } }));

  const [room, setRoom] = useState<RoomType>({ name: '', description: '', capacity: '1' });

  return (
    <SectionCard title="Accommodation Details">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Booking URL</Label>
          <Input
            placeholder="https://..."
            value={d.bookingUrl}
            onChange={(e) => update({ bookingUrl: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Age Restriction</Label>
          <Input
            placeholder="e.g. 18+"
            value={d.ageRestriction}
            onChange={(e) => update({ ageRestriction: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Check-in Time</Label>
          <Input
            type="time"
            value={d.checkInTime}
            onChange={(e) => update({ checkInTime: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Check-out Time</Label>
          <Input
            type="time"
            value={d.checkOutTime}
            onChange={(e) => update({ checkOutTime: e.target.value })}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Switch
          checked={d.petsAllowed}
          onCheckedChange={(v) => update({ petsAllowed: v })}
          id="pets"
        />
        <Label htmlFor="pets">Pets Allowed</Label>
      </div>

      <Separator />
      <div className="space-y-3">
        <Label className="text-sm font-medium">Room Types</Label>
        <div className="grid grid-cols-3 gap-2">
          <Input
            placeholder="Room name"
            value={room.name}
            onChange={(e) => setRoom((r) => ({ ...r, name: e.target.value }))}
          />
          <Input
            placeholder="Description"
            value={room.description}
            onChange={(e) => setRoom((r) => ({ ...r, description: e.target.value }))}
          />
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Capacity"
              min={1}
              value={room.capacity}
              onChange={(e) => setRoom((r) => ({ ...r, capacity: e.target.value }))}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => {
                if (room.name) {
                  update({ roomTypes: [...d.roomTypes, room] });
                  setRoom({ name: '', description: '', capacity: '1' });
                }
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {d.roomTypes.map((rt, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
          >
            <div>
              <span className="font-medium">{rt.name}</span>
              <span className="ml-2 text-muted-foreground">Capacity: {rt.capacity}</span>
              {rt.description && (
                <span className="ml-2 text-muted-foreground">{rt.description}</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => update({ roomTypes: d.roomTypes.filter((_, idx) => idx !== i) })}
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
            </button>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function EntertainmentSection({
  form,
  setForm,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
}) {
  const d = form.entertainmentData;
  const update = (patch: Partial<FormState['entertainmentData']>) =>
    setForm((f) => ({ ...f, entertainmentData: { ...f.entertainmentData, ...patch } }));

  const [tpEntry, setTpEntry] = useState<TicketPriceEntry>({ key: '', value: '' });

  return (
    <SectionCard title="Entertainment Details">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Ticket Booking URL</Label>
          <Input
            placeholder="https://..."
            value={d.ticketBookingUrl}
            onChange={(e) => update({ ticketBookingUrl: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Age Restriction</Label>
          <Input
            placeholder="e.g. 18+"
            value={d.ageRestriction}
            onChange={(e) => update({ ageRestriction: e.target.value })}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Event Schedule</Label>
        <Textarea
          placeholder="Describe the event schedule..."
          value={d.eventSchedule}
          onChange={(e) => update({ eventSchedule: e.target.value })}
          rows={3}
        />
      </div>
      <ArrayChipInput
        label="Current Exhibits"
        placeholder="Exhibit name"
        items={d.currentExhibits}
        onAdd={(v) => update({ currentExhibits: [...d.currentExhibits, v] })}
        onRemove={(i) =>
          update({ currentExhibits: d.currentExhibits.filter((_, idx) => idx !== i) })
        }
      />

      <Separator />
      <div className="space-y-3">
        <Label className="text-sm font-medium">Ticket Prices</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Category (e.g. Adult)"
            value={tpEntry.key}
            onChange={(e) => setTpEntry((t) => ({ ...t, key: e.target.value }))}
          />
          <Input
            placeholder="Price (e.g. $15)"
            value={tpEntry.value}
            onChange={(e) => setTpEntry((t) => ({ ...t, value: e.target.value }))}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => {
              if (tpEntry.key && tpEntry.value) {
                update({ ticketPriceEntries: [...d.ticketPriceEntries, tpEntry] });
                setTpEntry({ key: '', value: '' });
              }
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {d.ticketPriceEntries.map((tp, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
          >
            <span>
              <span className="font-medium">{tp.key}:</span> {tp.value}
            </span>
            <button
              type="button"
              onClick={() =>
                update({ ticketPriceEntries: d.ticketPriceEntries.filter((_, idx) => idx !== i) })
              }
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
            </button>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function ShoppingSection({
  form,
  setForm,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
}) {
  const d = form.shoppingData;
  const update = (patch: Partial<FormState['shoppingData']>) =>
    setForm((f) => ({ ...f, shoppingData: { ...f.shoppingData, ...patch } }));

  return (
    <SectionCard title="Shopping Details">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ArrayChipInput
          label="Product Categories"
          placeholder="e.g. Electronics"
          items={d.productCategories}
          onAdd={(v) => update({ productCategories: [...d.productCategories, v] })}
          onRemove={(i) =>
            update({ productCategories: d.productCategories.filter((_, idx) => idx !== i) })
          }
        />
        <ArrayChipInput
          label="Brands Carried"
          placeholder="e.g. Nike"
          items={d.brandsCarried}
          onAdd={(v) => update({ brandsCarried: [...d.brandsCarried, v] })}
          onRemove={(i) => update({ brandsCarried: d.brandsCarried.filter((_, idx) => idx !== i) })}
        />
        <div className="space-y-2">
          <Label>Online Store URL</Label>
          <Input
            placeholder="https://..."
            value={d.onlineStoreUrl}
            onChange={(e) => update({ onlineStoreUrl: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Booking / Reservation URL</Label>
          <Input
            placeholder="https://..."
            value={d.bookingUrl}
            onChange={(e) => update({ bookingUrl: e.target.value })}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Return Policy</Label>
        <Textarea
          placeholder="Describe return/exchange policy..."
          value={d.returnPolicy}
          onChange={(e) => update({ returnPolicy: e.target.value })}
          rows={3}
        />
      </div>
    </SectionCard>
  );
}

function TransportSection({
  form,
  setForm,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
}) {
  const d = form.transportData;
  const update = (patch: Partial<FormState['transportData']>) =>
    setForm((f) => ({ ...f, transportData: { ...f.transportData, ...patch } }));

  return (
    <SectionCard title="Transport Details">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Operator</Label>
          <Input
            placeholder="e.g. National Rail"
            value={d.operator}
            onChange={(e) => update({ operator: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Booking URL</Label>
          <Input
            placeholder="https://..."
            value={d.bookingUrl}
            onChange={(e) => update({ bookingUrl: e.target.value })}
          />
        </div>
        <ArrayChipInput
          label="Transport Lines"
          placeholder="e.g. Line 1"
          items={d.transportLines}
          onAdd={(v) => update({ transportLines: [...d.transportLines, v] })}
          onRemove={(i) =>
            update({ transportLines: d.transportLines.filter((_, idx) => idx !== i) })
          }
        />
        <ArrayChipInput
          label="Destinations"
          placeholder="e.g. Airport"
          items={d.destinations}
          onAdd={(v) => update({ destinations: [...d.destinations, v] })}
          onRemove={(i) => update({ destinations: d.destinations.filter((_, idx) => idx !== i) })}
        />
        <ArrayChipInput
          label="Vehicle Types"
          placeholder="e.g. Bus"
          items={d.vehicleTypes}
          onAdd={(v) => update({ vehicleTypes: [...d.vehicleTypes, v] })}
          onRemove={(i) => update({ vehicleTypes: d.vehicleTypes.filter((_, idx) => idx !== i) })}
        />
      </div>

      <Separator />
      <p className="text-sm font-medium">Rental Options</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(['perHour', 'perDay', 'perWeek', 'perMonth'] as const).map((key) => (
          <div key={key} className="space-y-2">
            <Label className="capitalize">{key.replace('per', 'Per ')}</Label>
            <Input
              type="number"
              placeholder="0.00"
              value={d.rentalOptions[key]}
              onChange={(e) =>
                update({ rentalOptions: { ...d.rentalOptions, [key]: e.target.value } })
              }
            />
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function HealthWellnessSection({
  form,
  setForm,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
}) {
  const d = form.healthWellnessData;
  const update = (patch: Partial<FormState['healthWellnessData']>) =>
    setForm((f) => ({ ...f, healthWellnessData: { ...f.healthWellnessData, ...patch } }));

  const [prac, setPrac] = useState<Practitioner>({
    name: '',
    specialty: '',
    qualifications: '',
    yearsOfExperience: '',
  });

  return (
    <SectionCard title="Health & Wellness Details">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ArrayChipInput
          label="Services Offered"
          placeholder="e.g. Yoga"
          items={d.servicesOffered}
          onAdd={(v) => update({ servicesOffered: [...d.servicesOffered, v] })}
          onRemove={(i) =>
            update({ servicesOffered: d.servicesOffered.filter((_, idx) => idx !== i) })
          }
        />
        <div className="space-y-2">
          <Label>Appointment Booking URL</Label>
          <Input
            placeholder="https://..."
            value={d.appointmentBookingUrl}
            onChange={(e) => update({ appointmentBookingUrl: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Booking URL</Label>
          <Input
            placeholder="https://..."
            value={d.bookingUrl}
            onChange={(e) => update({ bookingUrl: e.target.value })}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Switch
          checked={d.insuranceAccepted}
          onCheckedChange={(v) => update({ insuranceAccepted: v })}
          id="insurance"
        />
        <Label htmlFor="insurance">Insurance Accepted</Label>
      </div>

      <Separator />
      <p className="text-sm font-medium">Membership Options</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {(['monthly', 'yearly', 'weekly', 'dayPass'] as const).map((key) => (
          <div key={key} className="space-y-2">
            <Label className="capitalize">
              {key === 'dayPass' ? 'Day Pass' : key.charAt(0).toUpperCase() + key.slice(1)}
            </Label>
            <Input
              type="number"
              placeholder="0.00"
              value={d.membershipOptions[key]}
              onChange={(e) =>
                update({
                  membershipOptions: {
                    ...d.membershipOptions,
                    [key]: e.target.value,
                  },
                })
              }
            />
          </div>
        ))}
        <div className="space-y-2">
          <Label>Trial Period</Label>
          <Input
            placeholder="e.g. 7 days"
            value={d.membershipOptions.trialPeriod}
            onChange={(e) =>
              update({
                membershipOptions: {
                  ...d.membershipOptions,
                  trialPeriod: e.target.value,
                },
              })
            }
          />
        </div>
      </div>
      <ArrayChipInput
        label="Membership Features"
        placeholder="e.g. Unlimited classes"
        items={d.membershipOptions.features}
        onAdd={(v) =>
          update({
            membershipOptions: {
              ...d.membershipOptions,
              features: [...d.membershipOptions.features, v],
            },
          })
        }
        onRemove={(i) =>
          update({
            membershipOptions: {
              ...d.membershipOptions,
              features: d.membershipOptions.features.filter((_, idx) => idx !== i),
            },
          })
        }
      />

      <Separator />
      <div className="space-y-3">
        <Label className="text-sm font-medium">Practitioners</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Input
            placeholder="Name"
            value={prac.name}
            onChange={(e) => setPrac((p) => ({ ...p, name: e.target.value }))}
          />
          <Input
            placeholder="Specialty"
            value={prac.specialty}
            onChange={(e) => setPrac((p) => ({ ...p, specialty: e.target.value }))}
          />
          <Input
            placeholder="Qualifications"
            value={prac.qualifications}
            onChange={(e) => setPrac((p) => ({ ...p, qualifications: e.target.value }))}
          />
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Years exp."
              value={prac.yearsOfExperience}
              onChange={(e) => setPrac((p) => ({ ...p, yearsOfExperience: e.target.value }))}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => {
                if (prac.name) {
                  update({ practitioners: [...d.practitioners, prac] });
                  setPrac({ name: '', specialty: '', qualifications: '', yearsOfExperience: '' });
                }
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {d.practitioners.map((p, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
          >
            <div>
              <span className="font-medium">{p.name}</span>
              {p.specialty && <span className="ml-2 text-muted-foreground">{p.specialty}</span>}
              {p.yearsOfExperience && (
                <span className="ml-2 text-muted-foreground">{p.yearsOfExperience} yrs</span>
              )}
            </div>
            <button
              type="button"
              onClick={() =>
                update({ practitioners: d.practitioners.filter((_, idx) => idx !== i) })
              }
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
            </button>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function NatureOutdoorsSection({
  form,
  setForm,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
}) {
  const d = form.natureOutdoorsData;
  const update = (patch: Partial<FormState['natureOutdoorsData']>) =>
    setForm((f) => ({ ...f, natureOutdoorsData: { ...f.natureOutdoorsData, ...patch } }));

  return (
    <SectionCard title="Nature & Outdoors Details">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Entry Fee</Label>
          <Input
            placeholder="e.g. $10 or Free"
            value={d.entryFee}
            onChange={(e) => update({ entryFee: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Best Time to Visit</Label>
          <Input
            placeholder="e.g. Spring (March–May)"
            value={d.bestTimeToVisit}
            onChange={(e) => update({ bestTimeToVisit: e.target.value })}
          />
        </div>
        <ArrayChipInput
          label="Key Activities"
          placeholder="e.g. Hiking"
          items={d.keyActivities}
          onAdd={(v) => update({ keyActivities: [...d.keyActivities, v] })}
          onRemove={(i) => update({ keyActivities: d.keyActivities.filter((_, idx) => idx !== i) })}
        />
        <ArrayChipInput
          label="Key Exhibits"
          placeholder="e.g. Waterfall"
          items={d.keyExhibits}
          onAdd={(v) => update({ keyExhibits: [...d.keyExhibits, v] })}
          onRemove={(i) => update({ keyExhibits: d.keyExhibits.filter((_, idx) => idx !== i) })}
        />
        <ArrayChipInput
          label="Rules"
          placeholder="e.g. No camping"
          items={d.rules}
          onAdd={(v) => update({ rules: [...d.rules, v] })}
          onRemove={(i) => update({ rules: d.rules.filter((_, idx) => idx !== i) })}
        />
      </div>
    </SectionCard>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function CreatePlacePage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialForm);
  const [uploadedImages, setUploadedImages] = useState<FileEntity[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: categoriesData } = useCategories({ onlyParents: true, limit: 100 });
  const categories = categoriesData?.data ?? [];

  const { data: selectedCategoryData } = useCategory(form.categoryId ? Number(form.categoryId) : 0);
  const subcategories = selectedCategoryData?.children ?? [];
  const categorySlug = selectedCategoryData?.slug ?? null;

  const { data: locationTree = [] } = useAdminLocationTree();
  const countries: AdminLocationNode[] = locationTree;
  const states: AdminLocationNode[] =
    countries.find((c) => String(c.id) === form.countryId)?.children ?? [];
  const cities: AdminLocationNode[] =
    states.find((s) => String(s.id) === form.stateId)?.children ?? [];

  const { data: allTags = [] } = useTags();
  const { data: allFacilities = [] } = useFacilities();

  const uploadFile = useUploadFile();
  const createPlace = useCreatePlace();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        const result = await uploadFile.mutateAsync({ file, folder: 'places' });
        const entity: FileEntity = (result as { data?: FileEntity }).data ?? (result as FileEntity);
        setUploadedImages((prev) => [...prev, entity]);
        setForm((f) => ({ ...f, imageIds: [...f.imageIds, entity.id] }));
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (id: number) => {
    setUploadedImages((prev) => prev.filter((img) => img.id !== id));
    setForm((f) => ({ ...f, imageIds: f.imageIds.filter((i) => i !== id) }));
  };

  const toggleTag = (id: number) =>
    setForm((f) => ({
      ...f,
      tagIds: f.tagIds.includes(id) ? f.tagIds.filter((x) => x !== id) : [...f.tagIds, id],
    }));

  const toggleFacility = (id: number) =>
    setForm((f) => ({
      ...f,
      facilityIds: f.facilityIds.includes(id)
        ? f.facilityIds.filter((x) => x !== id)
        : [...f.facilityIds, id],
    }));

  const updateDay = (day: Day, patch: Partial<DayHours>) =>
    setForm((f) => ({
      ...f,
      openingHours: { ...f.openingHours, [day]: { ...f.openingHours[day], ...patch } },
    }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.categoryId) return;

    const payload = buildPayload(form, categorySlug);
    const created = await createPlace.mutateAsync(payload);

    if (created?.id) {
      try {
        await api.patch(`/admin/places/${created.id}/approve`);
      } catch {
        // non-fatal — place is created, just not auto-approved
      }
      router.push(`/places/${created.id}`);
    }
  };

  const showPriceField = form.priceType === 'fixed' || form.priceType === 'discounted';
  const showRangeFields = form.priceType === 'range';

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-100">
            <MapPin className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Create Place</h1>
            <p className="text-muted-foreground text-sm">Add a new place to the platform</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── Basic Info ── */}
        <SectionCard title="Basic Information">
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Place name"
              value={form.name}
              onChange={(e) => {
                const name = e.target.value;
                setForm((f) => ({ ...f, name, slug: slugify(name) }));
              }}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe this place..."
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              placeholder="url-friendly-name"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">
              Auto-generated from name. Modify if needed.
            </p>
          </div>
        </SectionCard>

        {/* ── Category ── */}
        <SectionCard title="Category">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                Main Category <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.categoryId}
                onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v, subcategoryId: '' }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {subcategories.length > 0 && (
              <div className="space-y-2">
                <Label>Subcategory</Label>
                <Select
                  value={form.subcategoryId}
                  onValueChange={(v) => setForm((f) => ({ ...f, subcategoryId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    {subcategories.map((sub) => (
                      <SelectItem key={sub.id} value={String(sub.id)}>
                        {sub.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </SectionCard>

        {/* ── Location ── */}
        <SectionCard title="Location">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Country</Label>
              <Select
                value={form.countryId}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, countryId: v, stateId: '', cityId: '' }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>State / Region</Label>
              <Select
                value={form.stateId}
                onValueChange={(v) => setForm((f) => ({ ...f, stateId: v, cityId: '' }))}
                disabled={!form.countryId || states.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {states.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>City</Label>
              <Select
                value={form.cityId}
                onValueChange={(v) => setForm((f) => ({ ...f, cityId: v }))}
                disabled={!form.stateId || cities.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                placeholder="Street address"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Postal Code</Label>
              <Input
                placeholder="12345"
                value={form.postalCode}
                onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Latitude</Label>
              <Input
                type="number"
                step="any"
                placeholder="e.g. 40.7128"
                value={form.latitude}
                onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Longitude</Label>
              <Input
                type="number"
                step="any"
                placeholder="e.g. -74.0060"
                value={form.longitude}
                onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))}
              />
            </div>
          </div>
        </SectionCard>

        {/* ── Contact ── */}
        <SectionCard title="Contact Information">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                placeholder="+1 (555) 000-0000"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="info@place.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <Input
                placeholder="https://..."
                value={form.website}
                onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
              />
            </div>
          </div>
        </SectionCard>

        {/* ── Images ── */}
        <SectionCard title="Images">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="gap-2"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {uploading ? 'Uploading...' : 'Upload Images'}
          </Button>

          {uploadedImages.length > 0 && (
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mt-2">
              {uploadedImages.map((img) => (
                <div
                  key={img.id}
                  className="relative group aspect-square rounded-lg overflow-hidden border bg-muted"
                >
                  <Image src={img.url} alt={img.fileName} fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(img.id)}
                    className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* ── Opening Hours ── */}
        <SectionCard title="Opening Hours">
          <div className="flex items-center gap-3">
            <Switch
              checked={form.openFullDay}
              onCheckedChange={(v) => setForm((f) => ({ ...f, openFullDay: v }))}
              id="openFullDay"
            />
            <Label htmlFor="openFullDay">Open 24 hours / Full day</Label>
          </div>

          {!form.openFullDay && (
            <div className="space-y-2">
              {DAYS.map((day) => {
                const h = form.openingHours[day];
                return (
                  <div key={day} className="flex items-center gap-3">
                    <div className="w-24 text-sm font-medium capitalize">{day}</div>
                    <Switch
                      checked={!h.isClosed}
                      onCheckedChange={(open) => updateDay(day, { isClosed: !open })}
                      id={`closed-${day}`}
                    />
                    {!h.isClosed ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={h.open}
                          onChange={(e) => updateDay(day, { open: e.target.value })}
                          className="w-32 h-8 text-sm"
                        />
                        <span className="text-muted-foreground text-sm">to</span>
                        <Input
                          type="time"
                          value={h.close}
                          onChange={(e) => updateDay(day, { close: e.target.value })}
                          className="w-32 h-8 text-sm"
                        />
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Closed</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>

        {/* ── Social Links ── */}
        <SectionCard title="Social Media">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(['facebook', 'instagram', 'twitter', 'linkedin'] as const).map((key) => (
              <div key={key} className="space-y-2">
                <Label className="capitalize">{key}</Label>
                <Input
                  placeholder={`https://${key}.com/...`}
                  value={form.social[key]}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      social: { ...f.social, [key]: e.target.value },
                    }))
                  }
                />
              </div>
            ))}
          </div>
        </SectionCard>

        {/* ── Pricing ── */}
        <SectionCard title="Pricing">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Price Type</Label>
              <Select
                value={form.priceType}
                onValueChange={(v) => setForm((f) => ({ ...f, priceType: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select price type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="fixed">Fixed</SelectItem>
                  <SelectItem value="range">Range</SelectItem>
                  <SelectItem value="onRequest">On Request</SelectItem>
                  <SelectItem value="discounted">Discounted</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2 pb-0.5">
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.isPriceOnRequest}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, isPriceOnRequest: v }))}
                  id="priceOnRequest"
                />
                <Label htmlFor="priceOnRequest">Price on Request</Label>
              </div>
            </div>
          </div>

          {showPriceField && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Old Price</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={form.oldPrice}
                  onChange={(e) => setForm((f) => ({ ...f, oldPrice: e.target.value }))}
                />
              </div>
            </div>
          )}

          {showRangeFields && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min Price</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={form.minPrice}
                  onChange={(e) => setForm((f) => ({ ...f, minPrice: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Max Price</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={form.maxPrice}
                  onChange={(e) => setForm((f) => ({ ...f, maxPrice: e.target.value }))}
                />
              </div>
            </div>
          )}
        </SectionCard>

        {/* ── Tags & Facilities ── */}
        <SectionCard title="Tags & Facilities">
          {allTags.length > 0 && (
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => {
                  const selected = form.tagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`rounded-full border px-3 py-1 text-xs transition-colors ${selected ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground hover:border-primary/60'}`}
                    >
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {allFacilities.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label>Facilities</Label>
                <div className="flex flex-wrap gap-2">
                  {allFacilities.map((fac) => {
                    const selected = form.facilityIds.includes(fac.id);
                    return (
                      <button
                        key={fac.id}
                        type="button"
                        onClick={() => toggleFacility(fac.id)}
                        className={`rounded-full border px-3 py-1 text-xs transition-colors ${selected ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground hover:border-primary/60'}`}
                      >
                        {fac.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </SectionCard>

        {/* ── Category-specific sections ── */}
        {categorySlug === 'food-and-drink' && <RestaurantSection form={form} setForm={setForm} />}
        {categorySlug === 'accommodation' && <AccommodationSection form={form} setForm={setForm} />}
        {categorySlug === 'entertainment' && <EntertainmentSection form={form} setForm={setForm} />}
        {categorySlug === 'shopping' && <ShoppingSection form={form} setForm={setForm} />}
        {categorySlug === 'transport' && <TransportSection form={form} setForm={setForm} />}
        {categorySlug === 'health-and-wellness' && (
          <HealthWellnessSection form={form} setForm={setForm} />
        )}
        {categorySlug === 'nature-and-outdoors' && (
          <NatureOutdoorsSection form={form} setForm={setForm} />
        )}

        {/* ── Submit ── */}
        <div className="flex items-center gap-3 pb-8">
          <Button
            type="submit"
            disabled={!form.name.trim() || !form.categoryId || createPlace.isPending}
            className="gap-2"
          >
            {createPlace.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Create & Approve Place
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
