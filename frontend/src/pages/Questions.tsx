import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { questionService } from '../services/api';
import type { Question, PaginatedQuestions, User } from '../types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/atoms/pagination';
import { AuthPromptModal } from '@/components/AuthPromptModal';
import { AlertCircle, Loader2, Search, MapPin, Leaf, X, ChevronDown } from 'lucide-react';

import type { QuestionFilters as QuestionFiltersType } from '../types';

const STATES = [
  'Andaman and Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi (National Capital Territory)',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Puducherry',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
] as const;

const CROPS = [
  "Adapathiyan",
  "Agathi",
  "Ailanthus or Matti",
  "Ajwain (Carom seeds)",
  "Allspice",
  "Almond",
  "Aloe vera",
  "Amaranth",
  "Amaranthus",
  "Amla",
  "Anthurium",
  "Apple",
  "Apricot",
  "Arecanut",
  "Arhar",
  "Arhar Dal (Red Gram)",
  "Aromatic Rice",
  "Arrow root",
  "Arum (Elephant Foot Yam)",
  "Arum Lobe",
  "Arum Stem",
  "Ash Gourd",
  "Ash gourd",
  "Ashwagandha",
  "Asoka",
  "Avocado",
  "Babool / Indian gum arabic tree",
  "Babool Tree",
  "Baby corn",
  "Babycorn",
  "Bajra/Pearl millet",
  "Bamboo",
  "Banana",
  "Banana Stem",
  "Barley",
  "Barnyard Millet",
  "Barnyard millet",
  "Beans",
  "Beet root",
  "Beetroot",
  "Bengal Gram",
  "Bengal Gram/Chickpea",
  "Ber",
  "Ber (Jujube)",
  "Berseem",
  "Betel Leaf",
  "Betel leaf",
  "Betel vine",
  "Bethua Leaves",
  "Beto Shak",
  "Bird of paradise",
  "Bitter Gourd",
  "Bitter gourd",
  "Black Cumin",
  "Black Gram",
  "Black Grapes",
  "Black Pepper",
  "Black gram",
  "Black pepper",
  "Blueberry",
  "Bottle Gourd",
  "Bottle gourd",
  "Brahmi",
  "Brinjal",
  "Brinjal (Eggplant)",
  "Brinjal / Eggplant",
  "Broad beans",
  "Broccoli",
  "Brocolli",
  "Brown Top Millet",
  "Buckwheat",
  "Butter / Mahua Tree",
  "Cabbage",
  "Camboge",
  "Capsicum",
  "Cardamom",
  "Carnation",
  "Carom",
  "Carrot",
  "Cashew",
  "Cassava (Tapioca)",
  "Cassia",
  "Castor",
  "Casuarina",
  "Cauliflower",
  "Celery",
  "Celery Seeds",
  "Ceylon Spinach",
  "Chadachi",
  "Char Magaz",
  "Chayote",
  "Chengazhinirkizhangu",
  "Chethikoduveli",
  "Chick pea",
  "Chickpea",
  "Chickpea, Bengal gram",
  "Chikoo",
  "Chilli",
  "Chilly",
  "China aster",
  "Chinese cabbage",
  "Chittadalotakam",
  "Chittaratha",
  "Chow Chow",
  "Chrysanthemum",
  "Cinnamon",
  "Citronella grass",
  "Citrus",
  "Clove",
  "Cloves",
  "Cluster bean",
  "Cocoa",
  "Coconut",
  "Coffee",
  "Coleus",
  "Colocacia",
  "Colocasia",
  "Congosignal grass",
  "Coriander",
  "Coriander (Cilantro)",
  "Coriander Leaves/Seeds",
  "Cotton",
  "Cowpea",
  "Crossandra",
  "Cucumber",
  "Cumin",
  "Cumin Seeds",
  "Curry leaves",
  "Custard Apple",
  "Custard apple",
  "Daincha",
  "Danthappala",
  "Darjeeling Orange",
  "Date",
  "Date Palm",
  "Date palm",
  "Davana",
  "Dill leaves",
  "Dillseed",
  "Dragon Fruit",
  "Drumstick",
  "Drumstick (Moringa)",
  "Elephant Apple",
  "Elephant Foot Yam",
  "Eucalyptus",
  "Fennel",
  "Fenugreek",
  "Fenugreek (Methi)",
  "Field pea",
  "Fig",
  "Finger Millet",
  "Finger millet",
  "Firecracker flower",
  "Fodder cowpea",
  "Fodder maize",
  "Fodder sorghum",
  "Foxtail Millet",
  "Foxtail millet",
  "French bean",
  "Gaillardia",
  "Galgal (Hill Lemon)",
  "Gamba grass",
  "Garlic",
  "Geranium",
  "Gerbera",
  "German Turnip",
  "Gherkins",
  "Ginger",
  "Gladiolus",
  "Gliricidia",
  "Gram",
  "Grape",
  "Grapes",
  "Greater yam",
  "Green Cardamom",
  "Green Chilli",
  "Green Gram",
  "Green Mango",
  "Green Papaya",
  "Green Peas",
  "Green gram",
  "Green gram, Golden gram",
  "Green pea",
  "Greeng gram",
  "Ground Nut",
  "Groundnut",
  "Guava",
  "Guinea grass",
  "Gymnema (Sugar destroyer)",
  "Hedge lucerne",
  "Heliconia",
  "Hogplum",
  "Holy basil",
  "Honey Plant",
  "Hops",
  "Horse Gram",
  "Horse gram",
  "Horsegram",
  "Hyacinth Bean",
  "Hyacinth Bean or Lablab Bean",
  "Hybrid napier",
  "Indian Beech / Pongam Tree",
  "Indian Beech Tree",
  "Indian Blackberry",
  "Indian Butter Tree / Mahua",
  "Indian Gooseberry",
  "Indian Gooseberry (Amla)",
  "Indian Jujube (Ber)",
  "Indian gooseberry",
  "Indian hogweed / Spiny amaranth",
  "Indian mustard",
  "Indian sarsaparilla (Mangani root)",
  "Indigo",
  "Irul",
  "Ivy Gourd",
  "Ivy gourd",
  "Jack",
  "Jack Fruit",
  "Jack fruit",
  "Jackfruit",
  "Jamun",
  "Jamun fruit",
  "Japanese Persimmon",
  "Jasmine",
  "Jeevakom",
  "Jicama",
  "Jute Leaves",
  "Kacholam",
  "Kagzi Lime",
  "Kalai Dal",
  "Kampakam",
  "Kanjiram",
  "Karinochi",
  "Karonda",
  "Kashi kanagile (local medicinal plant)",
  "Kasthurimanjal",
  "Kattarvazha",
  "Kidney Bean",
  "Kidney bean",
  "Kidney bean/Rajama",
  "Kinnow (mandarin)",
  "Kiwifruit",
  "Knol-khol",
  "Kodo millet",
  "Kokum",
  "Koovalam",
  "Kurumthotti",
  "Kusuma",
  "Lady's Finger",
  "Large Cardamom",
  "Lemon",
  "Lemongrass",
  "Lentil",
  "Lesser yarm",
  "Lettuce",
  "Lime / Lemon",
  "Linseed",
  "Linseed, Flax",
  "Litchi",
  "Little Millet",
  "Little millet",
  "Long melon",
  "Long pepper",
  "Loquat",
  "Lucerne",
  "Mahagony",
  "Mahogany",
  "Maize",
  "Malabar Neem",
  "Mandarin",
  "Mandarin orange",
  "Mangium",
  "Mango",
  "Mango-ginger",
  "Mangosteen",
  "Marigold",
  "Mash",
  "Matar Dal (Split peas)",
  "Mentha",
  "Mesta",
  "Millet",
  "Moong",
  "Moong Dal",
  "Moth Bean",
  "Moth bean",
  "Mung",
  "Mung bean",
  "Mushroom",
  "Muskmelon",
  "Mustard",
  "Musur Dal",
  "Napier Grass",
  "Neela amari",
  "Neem",
  "Neem (ground type)",
  "Niger",
  "Nilappana",
  "Nutmeg",
  "Oat",
  "Oats",
  "Oilpalm",
  "Okra",
  "Okra (Lady's finger)",
  "Olive",
  "Onion",
  "Orange",
  "Orange (Sweet Orange / Mosambi)",
  "Orchids",
  "Paddy",
  "Paddy/Rice",
  "Palmarosa",
  "Palmarosa grass",
  "Palmyra palm",
  "Papaya",
  "Para grass",
  "Paradise Tree",
  "Passion fruit",
  "Patchouli",
  "Pathimugham",
  "Pea",
  "Peach",
  "Pear",
  "Pearl Millet",
  "Pearl millet",
  "Pecan Nut",
  "Physic Nut / Jatropha",
  "Pickling melon",
  "Pigeon Pea",
  "Pigeon pea",
  "Pigeon pea, Red gram",
  "Pineapple",
  "Plum",
  "Pointed Gourd",
  "Pomegranate",
  "Potato",
  "Proso millet",
  "Proso milllet",
  "Pumpkin",
  "Punna",
  "Quina",
  "Raddish",
  "Radish",
  "Ragi",
  "Ramboothan",
  "Ramphal",
  "Rapeseed and Mustard",
  "Raw Bengal Gram",
  "Red Chilli",
  "Red Gram/Pigeon Pea",
  "Red Sandalwood",
  "Red Sanders / Red Sandalwood",
  "Red gram",
  "Rice",
  "Rice (Paddy)",
  "Ridge Gourd",
  "Ridge gourd",
  "Ripe Papaya",
  "Rose",
  "Rose (Greenhouse)",
  "Roselle / Red sorrel",
  "Rosemary",
  "Rosewood",
  "Round gourd",
  "Rubber",
  "Ryegrass",
  "Safed musli",
  "Safflower",
  "Sandal",
  "Sandalwood",
  "Sapodilla (Chiku)",
  "Sapota",
  "Sarpagandha (Indian snakeroot)",
  "Senji",
  "Sesame",
  "Sesame, Gingelly",
  "Setaria grass",
  "Shaftal",
  "Shah Marich",
  "Shevri",
  "Snake Gourd",
  "Snake gourd",
  "Sorghum",
  "Sorghum (Fodder)",
  "Sorghum (Rabi/Kharif)",
  "Soyabean",
  "Soybean",
  "Spinach",
  "Sponge gourd",
  "Squash",
  "Stevia",
  "Strawberry",
  "Stylo",
  "Subabul",
  "Sugarbeet",
  "Sugarcane",
  "Summer squash",
  "Sun hemp",
  "Sunflower",
  "Sweet Cherry",
  "Sweet Lemon",
  "Sweet Lime",
  "Sweet orange",
  "Sweet pepper",
  "Sweet potato",
  "Tamarind",
  "Tapioca",
  "Tea",
  "Teak",
  "Thembavu",
  "Thippali",
  "Thorny bamboo",
  "Thulasi",
  "Tobacco",
  "Tomato",
  "Tree Tomato",
  "Tuberose",
  "Tulsi (Holy basil)",
  "Turmeric",
  "Turnip",
  "Urd",
  "Vanilla",
  "Vegetable cowpea",
  "Venga",
  "Vetiver",
  "Vetiver (Khus grass)",
  "Walnut",
  "Wanga",
  "Water melon",
  "Watermelon",
  "West Indian Cherry",
  "Wheat",
  "White yam",
  "Wild Tamarind",
  "Wild date palm",
  "Wild indigo",
  "Wild jack or Aini",
  "Wood apple",
  "Yam",
] as const;

interface QuestionFilters extends QuestionFiltersType {
  state?: string;
  crop?: string;
  search?: string;
}

const USER_STORAGE_KEY = "ajrasakha_user";

export function Questions() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginatedQuestions | null>(null);
  // Default filter to show only closed questions
  const [filters, setFilters] = useState<QuestionFilters>({ status: 'closed' as const });
  const [searchInput, setSearchInput] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);

  const isAuthenticated = !!localStorage.getItem(USER_STORAGE_KEY);

  // Get stored user for userId query param (tells backend to cap limit at 5)
  const storedUserRaw = localStorage.getItem(USER_STORAGE_KEY);
  const storedUser: User | null = storedUserRaw ? (JSON.parse(storedUserRaw) as User) : null;
  // Authenticated users see all (limit 20); unauthenticated see 5 questions
  const DB_LIMIT = isAuthenticated ? 20 : 5;


  // Handle row click — prompt auth if not signed in
  const handleRowClick = (questionId: string) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    navigate(`/questions/${questionId}`);
  };

  const fetchQuestions = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      // Pass userId when authenticated so backend caps limit at 5
      const result = await questionService.getAll(
        filters,
        page,
        DB_LIMIT,
        storedUser?.id,
      );
      setQuestions(result.data);
      setPagination(result);
    } catch {
      setError('Failed to fetch questions. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filters, storedUser?.id]);

  // Fetch questions when filters or limit change
  useEffect(() => {
    fetchQuestions(1);
  }, [fetchQuestions]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput }));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleFilterChange = (key: 'state' | 'crop', value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const clearFilter = (key: 'state' | 'crop') => {
    setFilters((prev) => ({ ...prev, [key]: undefined }));
  };

  const clearAllFilters = () => {
    setFilters({ status: 'closed' as const });
    setSearchInput('');
  };

  const hasActiveFilters = filters.state || filters.crop || filters.search;

  const handlePageChange = (newPage: number) => {
    if (pagination && newPage >= 1 && newPage <= pagination.totalPages) {
      fetchQuestions(newPage);
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 py-6">
      <div className="mx-auto max-w-7xl space-y-5">
        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-card/60 p-2 shadow-sm backdrop-blur-sm sm:gap-3 sm:p-3">
          {/* Search */}
          <div className="relative min-w-[180px] max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search questions"
              value={searchInput}
              onFocus={() => { if (!isAuthenticated) setShowAuthModal(true); }}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-10 rounded-lg border-border/70 bg-background pl-9 pr-8 text-sm shadow-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/40"
            />
            {searchInput && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearchInput("")}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* State Filter */}
          <div className="relative flex items-center">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <select
              value={filters.state || ""}
              onChange={(e) => {
                if (!isAuthenticated) { setShowAuthModal(true); return; }
                handleFilterChange("state", e.target.value);
              }}
              className="h-10 w-36 cursor-pointer appearance-none rounded-lg border border-border/70 bg-background pl-9 pr-9 text-sm transition-colors hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/40 sm:w-44"
            >
              <option value="">All States</option>
              {STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
            {filters.state ? (
              <button
                type="button"
                aria-label="Clear state filter"
                onClick={() => clearFilter("state")}
                className="absolute right-1.5 top-1/2 z-10 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : (
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            )}
          </div>

          {/* Crop Filter */}
          <div className="relative flex items-center">
            <Leaf className="pointer-events-none absolute left-3 top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <select
              value={filters.crop || ""}
              onChange={(e) => {
                if (!isAuthenticated) { setShowAuthModal(true); return; }
                handleFilterChange("crop", e.target.value);
              }}
              className="h-10 w-36 cursor-pointer appearance-none rounded-lg border border-border/70 bg-background pl-9 pr-9 text-sm transition-colors hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/40 sm:w-44"
            >
              <option value="">All Crops</option>
              {CROPS.map((crop) => (
                <option key={crop} value={crop}>
                  {crop}
                </option>
              ))}
            </select>
            {filters.crop ? (
              <button
                type="button"
                aria-label="Clear crop filter"
                onClick={() => clearFilter("crop")}
                className="absolute right-1.5 top-1/2 z-10 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : (
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            )}
          </div>

          {/* Clear All */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="ml-auto flex h-9 items-center gap-1.5 rounded-full border border-border/70 px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-3 w-3" />
              Clear all
            </button>
          )}
        </div>

        {/* Table Card */}
        <Card className="w-full overflow-hidden rounded-xl border-border/60 shadow-sm">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-20">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Loading questions…
                </p>
              </div>
            ) : error ? (
              <div className="p-6">
                <Alert variant="destructive" className="border-destructive/50">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </div>
            ) : questions.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-20 text-center">
                <Search className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-base font-medium text-foreground">
                  No questions found
                </p>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your search or filters.
                </p>
              </div>
            ) : (
              <div className="relative flex h-[calc(100vh-16rem)] flex-col">
                <div className="flex flex-1 flex-col overflow-hidden">
                  <Table className="flex-1">
                    <TableHeader>
                      <TableRow className="border-border/60 bg-muted/40 hover:bg-muted/40">
                        <TableHead className="hidden w-12 py-3 pl-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:table-cell">
                          #
                        </TableHead>
                        <TableHead className="py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Question
                        </TableHead>
                        <TableHead className="w-40 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          State
                        </TableHead>
                        <TableHead className="w-40 py-3 pr-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Crop
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {questions.map((q, index) => (
                        <TableRow
                          key={q.id}
                          onClick={() => handleRowClick(q.id)}
                          className="group cursor-pointer border-border/50 transition-colors hover:bg-primary/5"
                        >
                          <TableCell className="hidden py-3.5 pl-4 text-sm tabular-nums text-muted-foreground sm:table-cell">
                            {(pagination
                              ? (pagination.page - 1) * DB_LIMIT
                              : 0) +
                              index +
                              1}
                          </TableCell>
                          <TableCell className="py-3.5">
                            <span className="line-clamp-2 text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                              {q.question}
                            </span>
                          </TableCell>
                          <TableCell className="py-3.5">
                            {q.details?.state ? (
                              <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                                {q.details.state}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground/60">
                                —
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="py-3.5 pr-4">
                            {q.details?.crop ? (
                              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                                {q.details.crop}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground/60">
                                —
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Gated overlay — positioned below the 5 visible rows */}
                {!isAuthenticated && (
                  <div className="pointer-events-none absolute bottom-0 left-0 right-0 top-[55%] flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/70 to-background/95 backdrop-blur-md" />
                    <div className="relative flex flex-col items-center gap-2 px-4 text-center">
                      <p className="text-sm font-medium text-foreground">
                        Sign in to browse all questions
                      </p>
                      <Button
                        type="button"
                        onClick={() => {
                          const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
                          window.location.href = `${backendUrl}/auth/google`;
                        }}
                        size="sm"
                        variant="outline"
                        className="pointer-events-auto gap-2 rounded-full bg-background shadow-sm"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                          aria-hidden="true"
                          className="h-4 w-4"
                        >
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          />
                        </svg>
                        Sign in with Google
                      </Button>
                    </div>
                  </div>
                )}

                {isAuthenticated && (
                  <div className="pointer-events-none absolute bottom-0 left-0 right-0 flex h-[calc(3*4.25rem)] items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/70 to-background/95 backdrop-blur-md" />
                    <p className="relative rounded-full border border-border/60 bg-background/90 px-4 py-1.5 text-sm font-medium text-foreground shadow-sm">
                      Subscribe to unlock all questions
                    </p>
                  </div>
                )}

                {/* Pagination — only show when logged in, z-10 to stay above blur overlay */}
                {isAuthenticated && pagination && pagination.totalPages > 0 && (
                  <div className="relative z-10 flex items-center justify-between border-t border-border/60 bg-muted/20 px-4 py-3">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground tabular-nums">
                        {pagination.total}
                      </span>{" "}
                      results
                    </p>
                    <Pagination
                      currentPage={pagination.page}
                      totalPages={pagination.totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <AuthPromptModal
          open={showAuthModal}
          onOpenChange={setShowAuthModal}
          message="Sign in with Google to browse all questions and access full details."
        />
      </div>
    </div>
  );
}