import { useEffect, useState, useMemo } from 'react';
import { loadData } from './utils/dataLoader';
import { SearchBar } from './components/SearchBar';
import { FilterPanel } from './components/FilterPanel';
import { ResultList } from './components/ResultList';
import { TrendChart } from './components/TrendChart';
import { ContextModal } from './components/ContextModal';
import { Pagination } from './components/Pagination';
// import { AIAgent } from './components/AIAgent';
import { TopSpeakers } from './components/TopSpeakers';
import { RelatedKeywords } from './components/RelatedKeywords';
import { ArrowDown, ArrowUp } from 'lucide-react';

const ITEMS_PER_PAGE = 20;

function App() {
  const [data, setData] = useState([]);
  const [speakerMeta, setSpeakerMeta] = useState({});
  const [loading, setLoading] = useState(true);

  // Input state
  const [searchTerm, setSearchTerm] = useState('');
  // Active search state (triggered by Search button/Enter)
  const [activeQuery, setActiveQuery] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contextItems, setContextItems] = useState([]);
  const [selectedContextItem, setSelectedContextItem] = useState(null);


  const [filters, setFilters] = useState({
    committee: '',
    category: '', // Changed from speaker
    yearRange: [2015, 2025], // Default: 2015-2025
    sort: 'desc' // Default: Newest first
  });

  // Load Data
  useEffect(() => {
    Promise.all([
      loadData(`${import.meta.env.BASE_URL}data/gijiroku.json`),
      loadData(`${import.meta.env.BASE_URL}data/speaker_meta.json`).catch(err => {
        console.warn("Failed to load speaker meta:", err);
        return {};
      })
    ])
      .then(([data, meta]) => {
        // Assign an original index to each item to preserve stable secondary sort
        const dataWithIndex = data.map((item, index) => ({ ...item, originalIndex: index }));
        setData(dataWithIndex);
        setSpeakerMeta(meta);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load data:", err);
        setLoading(false);
      });
  }, []);

  // Compute Statistics for Dropdowns (memoized)
  const options = useMemo(() => {
    if (!data.length) return { committees: [], categories: [], minYear: 2003, maxYear: 2025 };

    const committees = [...new Set(data.map(d => d.type).filter(Boolean))].sort();

    // Sort Categories (Speakers): Incumbent (Kana) > Former (Kana) > Others (Name)
    const categories = [...new Set(data.map(d => d.category).filter(Boolean))].sort((a, b) => {
      const metaA = speakerMeta[a];
      const metaB = speakerMeta[b];

      // 1. Prioritize speakers in metadata (Incumbent/Former) over others
      if (metaA && !metaB) return -1;
      if (!metaA && metaB) return 1;

      if (metaA && metaB) {
        // 2. Prioritize Incumbent (現職) over Former (元職)
        if (metaA.status !== metaB.status) {
          return metaA.status === '現職' ? -1 : 1;
        }
        // 3. Sort by Kana
        if (metaA.kana && metaB.kana) {
          return metaA.kana.localeCompare(metaB.kana, 'ja');
        }
      }

      // 4. Default alphabetic sort
      return a.localeCompare(b, 'ja');
    });

    const years = [...new Set(data.map(d => d.year).filter(Boolean))].sort((a, b) => b - a);
    const minYear = Math.min(...years) || 2003;
    const maxYear = Math.max(...years) || 2025;

    return { committees, categories, minYear, maxYear };
  }, [data, speakerMeta]);

  // Filtering Logic
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // 1. Text Search - Use activeQuery instead of searchTerm
      if (activeQuery) {
        const normalize = (str) => str ? str.normalize('NFKC').toLowerCase() : '';
        const q = normalize(activeQuery);

        const matchBody = normalize(item.body).includes(q);
        const matchSpeaker = normalize(item.speaker).includes(q);
        const matchId = normalize(item.id).includes(q);

        if (!matchBody && !matchSpeaker && !matchId) return false;
      }

      // 2. Filters
      // Range Check
      // Range Check
      if (filters.yearRange) {
        const [start, end] = filters.yearRange;
        const itemYear = parseInt(item.year);
        if (itemYear < start || itemYear > end) return false;
      }

      if (filters.committee && item.type !== filters.committee) return false;
      if (filters.category && item.category !== filters.category) return false;

      return true;
    });
  }, [data, activeQuery, filters]);

  // Sorting Logic
  const sortedData = useMemo(() => {
    const sorted = [...filteredData];
    sorted.sort((a, b) => {
      if (filters.sort === 'asc') {
        return a.originalIndex - b.originalIndex;
      } else {
        return b.originalIndex - a.originalIndex;
      }
    });
    return sorted;
  }, [filteredData, filters.sort]);

  // Reset pagination when filters, query, OR sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeQuery, filters]);

  // Trend Data preparation
  const trendData = useMemo(() => {
    const counts = {};
    filteredData.forEach(item => {
      const year = item.year;
      if (year) counts[year] = (counts[year] || 0) + 1;
    });

    return Object.keys(counts).sort().map(year => ({
      year,
      count: counts[year]
    }));
  }, [filteredData]);

  // Pagination Logic
  const totalPages = Math.ceil(sortedData.length / ITEMS_PER_PAGE);
  const displayData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedData.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedData, currentPage]);

  const handleSearch = () => {
    setActiveQuery(searchTerm);
  };

  const openContext = (item) => {
    setSelectedContextItem(item);

    // Find all items belonging to the same meeting
    // Matching by Year, Date, and Meeting Name (Title/Type)
    // The dataset has 'title' (会議の名称) which is specific e.g., "平成15年第一回臨時会会議録（第1日　5月27日)"
    // This is the best candidate for grouping a single meeting session.
    const meetingItems = data.filter(d => d.title === item.title);

    setContextItems(meetingItems);
    setIsModalOpen(true);
  };

  const closeContext = () => {
    setIsModalOpen(false);
    setSelectedContextItem(null);
    setContextItems([]);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="flex items-center gap-3">
              <img src={`${import.meta.env.BASE_URL}mielogo.png`} alt="みえる議会(仮) - 中央区" className="h-10 md:h-12 w-auto object-contain" />
              <span className="text-xl md:text-2xl font-extrabold text-slate-800 whitespace-nowrap">
                みえる議会(仮) - 中央区
              </span>
            </h1>
          </div>
          <div className="text-right">
            <div className="text-xs font-medium text-slate-500 mb-0.5">
              収録範囲(2003/5/27 - 2025/7/3)
            </div>
            <div className="text-xs font-bold text-primary-600">
              {loading ? 'Loading...' : `${data.length.toLocaleString()} records`}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Removed center title block */}

        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          onSearch={handleSearch}
        />

        {!loading && (
          <>
            <FilterPanel
              filters={filters}
              setFilters={setFilters}
              options={options}
              speakerMeta={speakerMeta}
            />



            {/* Results Section - Distinct Design */}
            {(activeQuery || filters.committee || filters.category || filters.yearRange) ? (
              <div className="mt-12 pt-8 border-t-2 border-slate-100">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-1.5 h-8 bg-yellow-400 rounded-full"></div>
                  <h2 className="text-xl font-bold text-slate-800">検索・分析結果</h2>
                </div>

                {/* Analysis Dashboard (Only Show if Searching) */}
                {activeQuery && (<>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    {/* Left: Trend Chart */}
                    <div className="h-auto md:h-[360px] relative">
                      {/* Reset Button for Trend Chart Drill-down */}
                      {filters.yearRange && filters.yearRange[0] === filters.yearRange[1] && (
                        <button
                          onClick={() => setFilters(prev => ({ ...prev, yearRange: [2015, options.maxYear || 2025] }))}
                          className="absolute top-2 right-2 z-10 px-2 py-1 bg-white/90 border border-slate-200 rounded shadow-sm text-xs text-slate-500 hover:text-primary-600 hover:bg-slate-50 transition-colors flex items-center gap-1"
                        >
                          <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
                          解除
                        </button>
                      )}

                      {trendData.length > 0 ? (
                        <TrendChart
                          data={trendData}
                          globalMaxYear={options.maxYear}
                          onYearClick={(year) => setFilters(prev => ({ ...prev, yearRange: [parseInt(year), parseInt(year)] }))}
                        />
                      ) : (
                        <div className="h-64 md:h-full bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">データなし</div>
                      )}
                    </div>

                    {/* Right: Top Speakers */}
                    <div className="h-72 md:h-[360px] contents-mobile-fix">
                      <TopSpeakers
                        data={filteredData}
                        currentCategory={filters.category}
                        onCategoryClick={(category) => setFilters(prev => ({ ...prev, category }))}
                      />
                    </div>
                  </div>

                  {/* Use RelatedKeywords instead of TopicCloud */}
                  <div className="mb-12">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 px-2 flex items-center gap-2">
                      <span className="w-1 h-6 bg-blue-400 rounded-full"></span>
                      関連キーワード (Top 10)
                    </h3>
                    <div className="border border-slate-100 rounded-xl shadow-sm bg-white">
                      <RelatedKeywords
                        data={filteredData}
                        query={activeQuery}
                        onKeywordClick={(word) => {
                          setSearchTerm(word);
                          setActiveQuery(word);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      />
                    </div>
                  </div>
                </>)}

                {/* Results Header: Count & Sort */}
                <div className="flex items-center justify-between mb-4 px-2">
                  <h3 className="text-lg font-bold text-slate-700">
                    発言一覧
                    <span className="ml-2 text-sm font-normal text-slate-500">
                      {filteredData.length.toLocaleString()} 件
                    </span>
                  </h3>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, sort: prev.sort === 'desc' ? 'asc' : 'desc' }))}
                      className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700"
                    >
                      {filters.sort === 'desc' ? (
                        <ArrowDown size={16} className="text-yellow-600" />
                      ) : (
                        <ArrowUp size={16} className="text-yellow-600" />
                      )}
                      {filters.sort === 'desc' ? '新しい順' : '古い順'}
                    </button>
                  </div>
                </div>

                <ResultList results={displayData} query={activeQuery} onContextClick={openContext} />

                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            ) : (
              <div className="text-center py-20 text-slate-400">
                条件を指定して検索してください
              </div>
            )}

            <ContextModal
              isOpen={isModalOpen}
              onClose={closeContext}
              selectedItem={selectedContextItem}
              contextItems={contextItems}
              query={activeQuery}
            />
          </>
        )}
      </main>

      <footer className="max-w-5xl mx-auto px-6 py-8 text-center text-xs text-slate-400">
        このサイトは中央区議会の議事録データを元に、ほづみゆうきが作成したものです。
        <br />
        正確性を期しておりますが正確な情報は中央区議会のwebサイトをご覧ください。
      </footer>

    </div>
  );
}

export default App;
