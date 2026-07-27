import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { questionService } from '../services/api';
import type { Question, PaginatedQuestions } from '../types';
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
import { Pagination } from '@/components/atoms/pagination';
import { AlertCircle, Loader2, Search, MapPin, Leaf, X } from 'lucide-react';

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

export function Questions() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginatedQuestions | null>(null);
  // Default filter to show only closed questions
  const [filters, setFilters] = useState<QuestionFilters>({ status: 'closed' as const });
  const [searchInput, setSearchInput] = useState('');
  const limit = 20;

  // Handle row click to navigate to question detail
  const handleRowClick = (questionId: string) => {
    navigate(`/questions/${questionId}`);
  };

  const fetchQuestions = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const result = await questionService.getAll(filters, page, limit);
      setQuestions(result.data);
      setPagination(result);
    } catch {
      setError('Failed to fetch questions. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filters, limit]);

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
    <div className="w-full px-6 py-4">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Inline Filter Bar */}
        <div className="flex flex-wrap items-center gap-3 mt-6">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search questions"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 h-9 text-sm bg-background"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* State Filter */}
          <div className="relative flex items-center">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none z-10" />
            <select
              value={filters.state || ''}
              onChange={(e) => handleFilterChange('state', e.target.value)}
              className="pl-8 pr-8 h-9 w-44 text-sm bg-background border border-border rounded-md appearance-none cursor-pointer hover:border-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">All States</option>
              {STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
            {filters.state && (
              <button
                onClick={() => clearFilter('state')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 z-10"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Crop Filter */}
          <div className="relative flex items-center">
            <Leaf className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none z-10" />
            <select
              value={filters.crop || ''}
              onChange={(e) => handleFilterChange('crop', e.target.value)}
              className="pl-8 pr-8 h-9 w-44 text-sm bg-background border border-border rounded-md appearance-none cursor-pointer hover:border-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">All Crops</option>
              {CROPS.map((crop) => (
                <option key={crop} value={crop}>
                  {crop}
                </option>
              ))}
            </select>
            {filters.crop && (
              <button
                onClick={() => clearFilter('crop')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 z-10"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Clear All */}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 h-9 px-2"
            >
              <X className="h-3 w-3" />
              Clear
            </button>
          )}
        </div>

        {/* Table Card */}
        <Card className="shadow-sm border-border/50 overflow-hidden w-full">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading...</p>
              </div>
            ) : error ? (
              <div className="p-6">
                <Alert variant="destructive" className="border-destructive/50">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-destructive-foreground">
                    {error}
                  </AlertDescription>
                </Alert>
              </div>
            ) : questions.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-muted-foreground text-base">
                  No questions found matching your criteria.
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
              <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 border-border">
                        <TableHead className="pl-4 py-3 font-medium text-foreground text-sm w-12">
                          #
                        </TableHead>
                        <TableHead className="py-3 font-medium text-foreground text-sm">
                          Question
                        </TableHead>
                        <TableHead className="py-3 font-medium text-foreground text-sm">
                          State
                        </TableHead>
                        <TableHead className="pr-4 py-3 font-medium text-foreground text-sm">
                          Crop
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {questions.map((q, index) => (
                        <TableRow
                          key={q.id}
                          onClick={() => handleRowClick(q.id)}
                          className={`border-border hover:bg-muted/30 transition-colors cursor-pointer ${
                            index % 2 === 0 ? 'bg-background' : 'bg-muted/5'
                          }`}
                        >
                          <TableCell className="pl-4 py-3 text-sm text-muted-foreground">
                            {(pagination ? (pagination.page - 1) * limit : 0) + index + 1}
                          </TableCell>
                          <TableCell className="py-3">
                            <span className="text-sm text-foreground line-clamp-2">
                              {q.question}
                            </span>
                          </TableCell>
                          <TableCell className="py-3">
                            <span className="text-sm text-muted-foreground">
                              {q.details?.state || '-'}
                            </span>
                          </TableCell>
                          <TableCell className="pr-4 py-3">
                            <span className="text-sm text-muted-foreground">
                              {q.details?.crop || '-'}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 0 && (
                  <div className="px-4 py-3 border-t border-border flex items-center justify-between bg-muted/10">
                    <p className="text-xs text-muted-foreground">
                      {pagination.total} results
                    </p>
                    <Pagination
                      currentPage={pagination.page}
                      totalPages={pagination.totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}