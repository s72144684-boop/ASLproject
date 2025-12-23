export const WORD_LIST = [
    // === 核心代名詞與基礎詞 (Core) ===
    "I", "YOU", "HE", "SHE", "IT", "WE", "THEY", "ME", "HIM", "HER", "US", "THEM",
    "MY", "YOUR", "HIS", "ITS", "OUR", "THEIR", "MINE", "YOURS", "HERS", "OURS", "THEIRS",
    "THIS", "THAT", "THESE", "THOSE", "WHO", "WHOM", "WHOSE", "WHICH", "WHAT",
    "ANY", "SOME", "NO", "NONE", "ALL", "MANY", "MUCH", "FEW", "LITTLE", "OTHER", "ANOTHER",

    // === 常用動詞 (Verbs - Top 200) ===
    "BE", "IS", "AM", "ARE", "WAS", "WERE", "BEEN",
    "HAVE", "HAS", "HAD", "DO", "DOES", "DID", "DONE",
    "SAY", "SAID", "GET", "GOT", "MAKE", "MADE", "GO", "WENT", "GONE",
    "KNOW", "KNEW", "TAKE", "TOOK", "SEE", "SAW", "SEEN", "COME", "CAME",
    "THINK", "THOUGHT", "LOOK", "WANT", "WANTED", "GIVE", "GAVE", "GIVEN",
    "USE", "USED", "FIND", "FOUND", "TELL", "TOLD", "ASK", "ASKED",
    "WORK", "WORKED", "SEEM", "SEEMED", "FEEL", "FELT", "TRY", "TRIED",
    "LEAVE", "LEFT", "CALL", "CALLED", "SHOULD", "NEED", "NEEDED", "BECOME", "BECAME",
    "PUT", "MEAN", "MEANT", "KEEP", "KEPT", "LET", "BEGIN", "BEGAN", "BEGUN",
    "HELP", "HELPED", "TALK", "TALKED", "TURN", "TURNED", "START", "STARTED",
    "SHOW", "SHOWED", "HEAR", "HEARD", "PLAY", "PLAYED", "RUN", "RAN",
    "MOVE", "MOVED", "LIKE", "LIKED", "LIVE", "LIVED", "BELIEVE", "BELIEVED",
    "HOLD", "HELD", "BRING", "BROUGHT", "HAPPEN", "HAPPENED", "WRITE", "WROTE", "WRITTEN",
    "SIT", "SAT", "STAND", "STOOD", "LOSE", "LOST", "PAY", "PAID", "MEET", "MET",
    "INCLUDE", "CONTINUE", "SET", "LEARN", "LEARNED", "CHANGE", "CHANGED",
    "LEAD", "LED", "UNDERSTAND", "UNDERSTOOD", "WATCH", "WATCHED", "FOLLOW", "FOLLOWED",
    "STOP", "STOPPED", "CREATE", "CREATED", "SPEAK", "SPOKE", "SPOKEN", "READ",
    "ALLOW", "ALLOWED", "ADD", "ADDED", "SPEND", "SPENT", "GROW", "GREW", "GROWN",
    "OPEN", "OPENED", "WALK", "WALKED", "WIN", "WON", "OFFER", "OFFERED",
    "REMEMBER", "REMEMBERED", "LOVE", "LOVED", "CONSIDER", "CONSIDERED", "APPEAR", "APPEARED",
    "BUY", "BOUGHT", "WAIT", "WAITED", "SERVE", "SERVED", "DIE", "DIED",
    "SEND", "SENT", "EXPECT", "EXPECTED", "BUILD", "BUILT", "STAY", "STAYED",
    "FALL", "FELL", "FALLEN", "CUT", "REACH", "REACHED", "KILL", "KILLED",
    "REMAIN", "REMAINED", "SUGGEST", "RAISE", "PASS", "SELL", "SOLD",
    "REQUIRE", "REPORT", "DECIDE", "PULL", "BREAK", "BROKE", "BROKEN",

    // === 時間與數字 (Time & Numbers) ===
    "TIME", "YEAR", "MONTH", "WEEK", "DAY", "HOUR", "MINUTE", "SECOND",
    "MORNING", "AFTERNOON", "EVENING", "NIGHT", "TODAY", "TOMORROW", "YESTERDAY",
    "NOW", "THEN", "LATER", "SOON", "EARLY", "LATE", "ALWAYS", "USUALLY", "OFTEN", "SOMETIMES", "NEVER",
    "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE", "TEN",
    "ELEVEN", "TWELVE", "TWENTY", "THIRTY", "FORTY", "FIFTY", "HUNDRED", "THOUSAND", "MILLION",
    "FIRST", "SECOND", "THIRD", "LAST", "NEXT", "PAST", "FUTURE",
    "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
    "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER",
    "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY",

    // === 人物與關係 (People) ===
    "PEOPLE", "PERSON", "MAN", "MEN", "WOMAN", "WOMEN", "CHILD", "CHILDREN",
    "FAMILY", "FATHER", "DAD", "MOTHER", "MOM", "PARENT", "SON", "DAUGHTER",
    "BROTHER", "SISTER", "WIFE", "HUSBAND", "FRIEND", "BOY", "GIRL", "GUY",
    "TEACHER", "STUDENT", "DOCTOR", "NURSE", "POLICE", "PRESIDENT", "KING", "QUEEN",
    "NEIGHBOR", "GUEST", "LEADER", "MEMBER", "STAFF", "GROUP", "TEAM", "COMMUNITY",

    // === 身體與健康 (Body & Health) ===
    "BODY", "HEAD", "FACE", "EYE", "NOSE", "MOUTH", "EAR", "HAIR",
    "HAND", "ARM", "FINGER", "LEG", "FOOT", "FEET", "HEART", "MIND", "BRAIN",
    "BLOOD", "SKIN", "BACK", "BONE", "MUSCLE", "HEALTH", "SICK", "PAIN",
    "LIFE", "DEATH", "DEAD", "CORPSE",

    // === 食物與飲料 (Food) ===
    "FOOD", "WATER", "DRINK", "EAT", "HUNGRY", "THIRSTY",
    "BREAD", "RICE", "MEAT", "CHICKEN", "BEEF", "PORK", "FISH", "EGG",
    "FRUIT", "APPLE", "BANANA", "ORANGE", "LEMON", "GRAPE",
    "VEGETABLE", "POTATO", "TOMATO", "ONION", "CARROT", "SALAD",
    "MILK", "COFFEE", "TEA", "JUICE", "BEER", "WINE", "SODA",
    "CAKE", "COOKIE", "SUGAR", "SALT", "PEPPER", "OIL",
    "BREAKFAST", "LUNCH", "DINNER", "MEAL", "RESTAURANT", "MENU", "TABLE",

    // === 地點與自然 (Places & Nature) ===
    "WORLD", "COUNTRY", "STATE", "CITY", "TOWN", "VILLAGE",
    "HOME", "HOUSE", "APARTMENT", "ROOM", "BEDROOM", "KITCHEN", "BATHROOM",
    "SCHOOL", "OFFICE", "STORE", "SHOP", "MARKET", "HOSPITAL", "BANK",
    "PARK", "STREET", "ROAD", "AIRPORT", "STATION", "HOTEL", "CHURCH",
    "NATURE", "SKY", "SUN", "MOON", "STAR", "AIR", "WIND", "RAIN", "SNOW",
    "WATER", "SEA", "OCEAN", "RIVER", "LAKE", "MOUNTAIN", "HILL", "FOREST",
    "TREE", "FLOWER", "GRASS", "GROUND", "DIRT", "ROCK", "FIRE", "ICE",
    "ANIMAL", "DOG", "CAT", "BIRD", "HORSE", "COW", "PIG", "SHEEP",

    // === 物品與科技 (Objects & Tech) ===
    "THING", "OBJECT", "COMPUTER", "PHONE", "CAMERA", "TELEVISION", "RADIO",
    "INTERNET", "WEBSITE", "EMAIL", "MESSAGE", "VIDEO", "GAME", "MUSIC",
    "BOOK", "PAPER", "PEN", "PENCIL", "DESK", "CHAIR", "TABLE", "BED",
    "CAR", "BUS", "TRAIN", "PLANE", "BOAT", "BICYCLE", "MACHINE", "TOOL",
    "BOX", "BAG", "CUP", "GLASS", "PLATE", "SPOON", "FORK", "KNIFE",
    "CLOTHES", "SHIRT", "PANTS", "SHOE", "HAT", "COAT", "DRESS", "RING",
    "DOOR", "WINDOW", "WALL", "FLOOR", "ROOF", "KEY", "LOCK",

    // === 抽象概念 (Abstract) ===
    "WAY", "ART", "HISTORY", "LAW", "WAR", "PEACE", "POWER", "MONEY", "CASH",
    "BUSINESS", "JOB", "WORK", "IDEA", "MIND", "REASON", "FACT", "TRUTH", "LIE",
    "STORY", "PROBLEM", "ANSWER", "QUESTION", "NEWS", "RESULT", "CHANGE",
    "SYSTEM", "PROGRAM", "NUMBER", "LEVEL", "POINT", "SIDE", "PART", "SPACE",
    "LOVE", "HATE", "HOPE", "FEAR", "JOY", "SADNESS", "ANGER", "SURPRISE",
    "GOOD", "BAD", "RIGHT", "WRONG", "TRUE", "FALSE", "REAL", "FREE", "SAFE",
    "EASY", "HARD", "SIMPLE", "COMPLEX", "FULL", "EMPTY", "HIGH", "LOW",
    "BIG", "SMALL", "LONG", "SHORT", "OLD", "NEW", "YOUNG", "HOT", "COLD",
    "FAST", "SLOW", "STRONG", "WEAK", "HAPPY", "SAD", "RICH", "POOR",
    "CLEAN", "DIRTY", "BEAUTIFUL", "UGLY", "NICE", "KIND", "MEAN", "FINE",

    // === 常用連接詞與介系詞 (Connectors) ===
    "AND", "OR", "BUT", "BECAUSE", "IF", "SO", "AS", "THAN",
    "AT", "BY", "FOR", "FROM", "IN", "INTO", "OF", "OFF", "ON", "TO", "WITH",
    "ABOUT", "AFTER", "BEFORE", "DURING", "SINCE", "UNTIL",
    "ABOVE", "BELOW", "UNDER", "OVER", "BETWEEN", "AMONG",
    "THROUGH", "ACROSS", "AGAINST", "AROUND", "BEHIND", "NEAR", "FAR",

    // === ASL/社交常用 (ASL Specific) ===
    "HELLO", "HI", "GOODBYE", "BYE", "PLEASE", "THANKS", "SORRY", "EXCUSE",
    "WELCOME", "YES", "NO", "OK", "MAYBE", "NAME", "SIGN", "LANGUAGE", "DEAF", "HEARING"
];
