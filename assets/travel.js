/* 华脉 玩转美国: money-saving travel guides. Prices checked Oct 2026; always confirm on official sites before going.
   Photos are from Wikimedia Commons (loaded via Special:FilePath); credit links go to each file page. */
(function () {
  "use strict";
  const FP = f => "https://commons.wikimedia.org/wiki/Special:FilePath/" + encodeURIComponent(f) + "?width=1200";
  const PG = f => "https://commons.wikimedia.org/wiki/File:" + encodeURIComponent(f);
  const T = [
  { id: "bear-mountain", area: "near", tag: "一日游 · 赏秋叶", name: "熊山州立公园 Bear Mountain", short: "纽约人秋天看红叶的首选，一部车 $10 进园，动物园免费。",
    img: "View_from_Bear_Mountain_overlooking_Hudson_River.jpg", credit: "Wikimedia Commons",
    budget: "开车 4 人拼车，每人约 $15–25（含油钱和自带午餐）",
    sec: [
      ["为什么去", "离曼哈顿大约 1 小时车程，站在山顶能看到哈德逊河和满山红叶。秋天周末很多华人家庭来这里野餐、爬山，老人小孩都能玩。"],
      ["怎么去", "• 开车最方便：走 Palisades Parkway 到 19 号出口，导航填 “99 Service Rd, Tomkins Cove, NY 10986”（熊山酒店）。\n• 坐巴士：Coach USA ShortLine 从曼哈顿 Port Authority 有车到熊山，但现在班次有限，出发前上 coachusa.com 查时刻和票价。"],
      ["必玩", "• Perkins 纪念塔：开车上山顶，看哈德逊河全景，每年 4 月到 11 月底开放（看天气）。\n• 动物园和博物馆（Trailside Museums & Zoo）：免费，建议捐 $1，开放到 11 月 30 日。\n• 旋转木马：42 个手工雕刻的动物座位，小孩最爱。\n• 湖边散步、野餐。\n• 冬天（10 月底到 3 月）有溜冰场，门票 $5，租鞋 $10。"],
      ["什么时候去", "10 月中下旬红叶最好看。周末人很多，停车场容易满，尽量早上 9 点前到。"],
      ["省钱秘诀", "• 停车费 $10 是按车收，不是按人收，约上亲戚朋友拼一部车最划算。\n• 一年去好几个纽约州立公园的，可以买 $80 的 Empire Pass，全年大部分州立公园免费停车。\n• 自带午餐和水，园内吃饭贵。"]
    ], src: [["纽约州立公园官网", "https://parks.ny.gov/visit/state-parks/bear-mountain-state-park"]] },

  { id: "woodbury", area: "near", tag: "一日游 · 购物", name: "伍德伯里奥特莱斯 Woodbury Common", short: "美国东岸最大的名牌折扣村，250 多家店，法拉盛就有直达巴士。",
    img: "Woodbury_Commons_promenade.jpg", credit: "Wikimedia Commons",
    budget: "每人约 $55–70（来回巴士 + 午餐）",
    sec: [
      ["为什么去", "Coach、Michael Kors、Nike、Polo 等名牌常年打折，节日还会再打折。离纽约约 1.5–2 小时车程，是华人最常去的购物点之一。"],
      ["怎么去（不用开车）", "官网列出的巴士公司里，有几家从法拉盛、艾姆赫斯特、华埠直接发车，还有中文服务：\n• Eastern Bus：曼哈顿（含华埠）和皇后区（法拉盛、艾姆赫斯特等）。\n• Eight Star：曼哈顿和法拉盛、艾姆赫斯特。\n• Yehuu：法拉盛出发，中文服务。\n• 也可以从曼哈顿 Port Authority 坐 Coach USA 等巴士。\n票价各家不同，大约来回 $40–50，买票时问清楚。"],
      ["必逛", "• 先到游客中心领优惠券册。\n• 热门品牌：Coach、Kate Spade、Michael Kors、Nike、Ralph Lauren、Le Creuset 锅具。\n• 美食广场吃饭最便宜。"],
      ["什么时候去", "平日比周末人少很多。黑色星期五、劳动节、阵亡将士纪念日前后折扣最大，但人也最多。"],
      ["省钱秘诀", "• 出发前免费加入 Simon+ 会员（Simon 奥特莱斯的 App），有专属优惠券，部分店还有 3–4% 返现。\n• 买包含优惠券册的巴士套票。\n• 10 人以上团体有团体优惠，可以约朋友一起去。\n• 先上官网看想买的牌子有没有在打折，别冲动消费。"]
    ], src: [["奥特莱斯官网交通页", "https://www.premiumoutlets.com/outlet/woodbury-common/travel-here"]] },

  { id: "philadelphia", area: "near", tag: "一日游 · 历史", name: "费城 Philadelphia", short: "美国独立的地方，自由钟和独立厅都免费，坐火车约 $57 来回。",
    img: "Independence_Hall.jpg", credit: "Rdsmith4 · CC BY-SA 2.0",
    budget: "一日游每人约 $80–90（火车来回约 $57 + 吃饭）",
    sec: [
      ["为什么去", "美国在这里签署《独立宣言》和宪法，准备入籍考试的人去看看，历史一下就记住了。景点集中，走路就能逛完，主要景点都免费。"],
      ["怎么去", "• 最便宜的火车：从曼哈顿 Penn Station 坐 NJ Transit 到 Trenton，再换 SEPTA 的 Trenton 线到费城 30 街站，单程约 $28，约 2.5 小时。NJ Transit 一定要上车前买票，车上买要多付 $5。\n• 巴士：FlixBus、Peter Pan、Greyhound，单程约 $18–35，2–3.5 小时。\n• Amtrak 最快约 1.5 小时，提早订有时只要 $10–24，临时买要 $80–100。"],
      ["必玩", "• 自由钟（Liberty Bell）：免费，不用票，每天 9 点到 5 点。\n• 独立厅（Independence Hall）：免费，网上预约收 $1 手续费；早上 9:00–9:50 开放参观不用预约。\n• 费城美术馆前的“洛奇台阶”（电影《洛奇》），跑上去拍照。\n• Elfreth's Alley：美国最古老的住宅街之一。\n• Reading Terminal 市场（1136 Arch St）：每天 8 点到 6 点，吃的特别多。"],
      ["吃什么", "• 费城芝士牛肉三明治（Cheesesteak）：南费城的 Pat's 和 Geno's，两家对面开，招牌老店。\n• DiNic's 烤猪肉三明治：在 Reading Terminal 市场里。\n• 中国城 Dim Sum Garden（1020 Race St）：小笼包有名。"],
      ["省钱秘诀", "• 坐 NJ Transit + SEPTA 火车，比 Amtrak 便宜很多，记得先买票。\n• 早上 9 点前到独立厅，免预约免费参观。\n• 费城美术馆成人门票 $30，每月第一个星期日和每个星期五下午 5 点后“随意付”，想付多少都行。"]
    ], src: [["国家公园局 自由钟", "https://home.nps.gov/inde/planyourvisit/libertybellcenter.htm"], ["NJ Transit 去费城", "https://www.njtransit.com/philadelphia"]] },

  { id: "washington-dc", area: "near", tag: "周末游 · 博物馆", name: "华盛顿特区 Washington, D.C.", short: "美国首都，史密森尼博物馆全部免费，法拉盛和华埠有巴士直达。",
    img: "Capitol_Building_Full_View.jpg", credit: "Noclip · 公有领域",
    budget: "周末每人约 $150–200（不含住宿）",
    sec: [
      ["为什么去", "国会大厦、白宫、林肯纪念堂都在这里。最大的好处是：史密森尼的所有博物馆和国家动物园全部免费，玩两三天都看不完。"],
      ["怎么去", "• FlixBus：单程最低约 $33，约 4 小时。上车点有华埠（28 Allen St）、坚尼街 Lucky Star 和皇后区法拉盛，到华盛顿联合车站（Union Station）。\n• Peter Pan、Vamoose 等巴士约 $25–50。\n• Amtrak 约 3.5 小时，早上 7 点前的车提早订有时只要 $20 左右，平时约 $55。"],
      ["必玩（全部免费）", "• 国家广场：林肯纪念堂、二战纪念碑、华盛顿纪念碑。\n• 国家自然历史博物馆、国家航空航天博物馆。\n• 国家美术馆。\n• 国会大厦游客中心。\n• 美国植物园。\n• 国家动物园（大熊猫的老家）。\n• 非裔美国人历史博物馆需要预约免费票。"],
      ["吃什么", "• Ben's Chili Bowl（U 街）：华盛顿老字号，招牌是辣肉肠。\n• Good Stuff Eatery（国会山）：汉堡。"],
      ["什么时候去", "3 月底到 4 月初樱花季最美，但人最多（2026 年樱花盛开是 3 月 26 日）。秋天天气好、人少。"],
      ["省钱秘诀", "• 行程排满免费博物馆，门票一分钱不用花。\n• 华盛顿纪念碑：早上 8:45 在 15 街小屋排队领当天免费票；网上提前 30 天预约只收 $1。\n• 地铁周末单程只要 $2.25–2.50，一天坐不到 5 次就别买 $13.50 的一日票。\n• 从法拉盛或华埠坐巴士最省钱。"]
    ], src: [["史密森尼开放时间", "https://www.si.edu/visit/hours"], ["华盛顿地铁票价", "https://www.wmata.com/fares/basic.cfm"]] },

  { id: "boston", area: "near", tag: "周末游 · 名校", name: "波士顿 Boston", short: "哈佛、麻省理工都能免费逛，坚尼街的 Lucky Star 巴士还在开。",
    img: "Charles_River_Esplanade_Boston_May_2018_panorama.jpg", credit: "King of Hearts · CC BY-SA 4.0",
    budget: "周末每人约 $120–160（不含住宿）",
    sec: [
      ["为什么去", "美国最古老的城市之一，带孩子去哈佛、麻省理工走走，感受名校气氛。“自由之路”串起 16 个历史景点，自己走就行，不用花钱。"],
      ["怎么去", "• 华埠巴士 Lucky Star 还在开，现在通过 FlixBus 卖票：坚尼街 145 号（Bowery 和 Chrystie 之间）上车，到波士顿南站。\n• 其他巴士单程约 $15–45，平日（星期二、三）有时 $9–12，4–5.5 小时。\n• Amtrak 约 $50–130，约 4.5 小时。"],
      ["必玩", "• 自由之路（Freedom Trail）：2.5 英里，16 个景点，自己走免费。宪法号军舰免费上去看。\n• 哈佛大学校园、哈佛艺术博物馆。\n• 波士顿公共图书馆（Copley 广场）：漂亮又免费。\n• 波士顿公园和公共花园、查尔斯河滨。\n• 美术馆 MFA：成人 $30，每月第三个星期四只要 $5。"],
      ["吃什么", "• 北角（North End）意大利区：Pizzeria Regina，1926 年开业的老店。\n• Bova's 面包店：24 小时营业，买奶油甜卷（cannoli）。\n• 波士顿龙虾卷和蛤蜊浓汤。"],
      ["省钱秘诀", "• 早点订 Lucky Star 或 FlixBus，选平日出发更便宜。\n• 自由之路自己走，不用报团（导游团约 $17）。\n• 地铁单程 $2.40，坐得多可以买 $22.50 的 7 日票（要用 CharlieCard）。\n• 哈佛、麻省理工、图书馆都免费。"]
    ], src: [["FlixBus Lucky Star 上车点", "https://flixbus.com/bus/new-york-ny/new-york-city-chinatown-bowery-canal-st"], ["波士顿地铁票价", "https://mbta.com/fares"]] },

  { id: "niagara", area: "near", tag: "周末游 · 大瀑布", name: "尼亚加拉大瀑布（美国这边）", short: "走路进公园免费，星期二到四停车免费，坐船看瀑布 $30。",
    img: "American_and_Bridal_Falls_as_seen_from_Skylon_Tower.jpg", credit: "Ujjwal Kumar · 公有领域",
    budget: "周末每人约 $190–220（巴士 + 门票 + 吃饭，不含住宿）",
    sec: [
      ["为什么去", "世界三大瀑布之一，站在瀑布边上感受水雾扑面，非常震撼。美国这边的尼亚加拉瀑布州立公园是美国最古老的州立公园。"],
      ["怎么去", "• 很远，从纽约市过去大约 9 小时。\n• Greyhound 巴士：单程约 $59–62，从 Port Authority 出发。\n• Amtrak 火车也要 9 个多小时，车站离瀑布 10 分钟车程。\n• 法拉盛和华埠有很多中文旅行团，两三天的团省心，报名前比较价格和评价。"],
      ["必玩", "• 观景点：展望点（Prospect Point）、山羊岛（Goat Island），走路看瀑布免费。\n• 雾中少女号（Maid of the Mist）：坐船开到瀑布下面，成人 $30.25、6–12 岁 $19.75、5 岁以下免费。2026 年这一季到 11 月 8 日结束。\n• 风之洞（Cave of the Winds）：走木栈道到瀑布脚下，淡季（10 月 19 日到明年 3 月 31 日）成人只要 $14，青少年 $10，要穿可以湿的鞋。\n• 观景塔：唯一能同时看到美国瀑布和马蹄瀑布的地方。\n• 晚上瀑布有免费灯光秀。"],
      ["吃什么", "Anchor Bar：水牛城辣鸡翅的发源老店，在尼亚加拉也有分店。"],
      ["省钱秘诀", "• 走路进公园永远免费，只有开车要停车费。\n• 3 号停车场星期二到星期四全年免费，9 月 8 日到 5 月 21 日每天免费。1、2 号停车场淡季每天 $10。\n• 淡季去风之洞只要 $14。\n• 晚上看免费灯光秀。"]
    ], src: [["州立公园停车", "https://www.niagarafallsstatepark.com/park-information/parking/"], ["雾中少女号票价", "https://maidofthemist.com/schedule-pricing"]] },

  { id: "orlando", area: "usa", tag: "5 天 · 主题乐园", name: "佛州奥兰多：迪士尼和环球影城", short: "带孩子必去，1 月机票最便宜，多日票平均下来便宜一大截。",
    img: "", credit: "",
    budget: "5 天每人约 $1,200–1,700（2 人一间房）",
    sec: [
      ["为什么去", "迪士尼世界有 4 个乐园，环球影城有 3 个（包括新开的 Epic Universe），全世界最大的主题乐园集中地，冬天也暖和。"],
      ["怎么去", "• 拉瓜迪亚（LGA）、甘迺迪（JFK）、纽瓦克（EWR）都有直飞奥兰多（MCO），大约 2.5 小时。\n• 1 月机票最便宜，来回中位数约 $162；7、8 月最贵（约 $290–320）。提前 12 周左右订最划算。\n• 机场到迪士尼酒店可以坐 Mears Connect 巴士，成人来回 $34.60。"],
      ["门票", "• 迪士尼单日票：魔法王国约 $139–219，看日期，另加 6.5% 税。圣诞节和新年前夜魔法王国涨到 $229。\n• 环球单园单日票约 $119 起，Epic Universe 单日约 $139 起，3 日票约每天 $118，5 日票约每天 $93。\n• 停车：迪士尼乐园每天 $35，Disney Springs 免费；环球每天 $35。"],
      ["吃什么", "• 乐园里吃饭很贵，可以到 Mills 50 越南街区（Colonial Dr. 和 Mills Ave. 一带）：越南法包约 $4，一般菜 $8–12，比如 Phở 88、Bánh Mì Nha Trang。\n• Disney Springs 免费进、免费停车，可以逛街吃饭。"],
      ["什么时候去", "迪士尼人少的时段：1 月中下旬、4 月中到 5 月中、8 月中到 9 月底。8 月中到 10 月中是飓风季，1 月和 2 月初有些设施会维修。环球 9 月人最少。"],
      ["省钱秘诀", "• 买多日票：环球 5 日票每天 $93，比单日 $119 起便宜不少。\n• 选“淡季日期”，同一张票价格差很多。\n• 坐 Mears 巴士往返机场，不租车就省了每天 $35 停车费。\n• 1 月出发，机票最便宜。\n• 自带水和零食，到乐园外面吃饭。"]
    ], src: [["环球影城停车", "https://www.universalorlando.com/web/en/us/plan-your-visit/hours-information/directions-and-parking/index.html"]] },

  { id: "vegas-grand-canyon", area: "usa", tag: "4–5 天 · 赌城和大峡谷", name: "拉斯维加斯 + 大峡谷", short: "免费的音乐喷泉看个够，开车去大峡谷一车只收 $35。",
    img: "View_from_Mather_Point,_Grand_Canyon.jpg", credit: "Wikimedia Commons",
    budget: "4–5 天每人约 $850–1,200（2 人一间房）",
    sec: [
      ["为什么去", "晚上逛赌城灯火，白天去看世界自然奇观大峡谷，一趟玩两种完全不同的美国。"],
      ["怎么去", "• 纽约三个机场都有直飞拉斯维加斯（LAS），拉瓜迪亚通常最便宜。1 月机票最便宜（来回约 $311），10 月和 7 月最贵。提前约 9 周订。\n• 大峡谷西缘（West Rim）离赌城约 2.5 小时车程；南缘（South Rim）约 4.5 小时，建议住一晚，不要一天来回。"],
      ["必玩", "• 百乐宫音乐喷泉：免费，下午每 30 分钟一次，晚上 8 点后每 15 分钟一次。\n• 百乐宫植物花园：免费。\n• 老城 Fremont Street 灯光秀：免费，每晚整点。\n• “欢迎来到拉斯维加斯”大牌子拍照。\n• 大峡谷南缘：Mather Point 等观景点，园内免费接驳车。\n• 大峡谷西缘的玻璃天桥（Skywalk）：由印第安部落经营，含天桥的票 $99，下午 3 点后的日落票 $59 也含天桥。"],
      ["吃什么", "• Tacos El Gordo：大道上，墨西哥卷饼大多不到 $4。\n• Phở Kim Long（中国城 Spring Mountain Rd）：24 小时营业，约 $20 以内。"],
      ["一定要知道", "• 酒店有“度假村费”（resort fee），每晚另收约 $45–55，订房时一定要算进去。\n• 大峡谷南缘门票一部车 $35，7 天有效。\n• 2026 年起，非美国居民 16 岁以上去大峡谷等 11 个国家公园每人要多交 $100，国内来探亲的父母要注意。"],
      ["什么时候去", "3–5 月、9–11 月最舒服。夏天酒店便宜 3–5 成，但白天气温 105–115°F（40 多度）。周末房价比平日贵 5 成到 1 倍。"],
      ["省钱秘诀", "• 住平日（星期日到星期四）。\n• 比较价格时把度假村费算进去，或者选不收度假村费的酒店。\n• 赌城里坐 24 小时巴士 The Deuce，比打车便宜很多。\n• 免费表演看个够。\n• 去大峡谷一部车 $35，大家拼车。"]
    ], src: [["大峡谷门票", "https://www.nps.gov/grca/planyourvisit/fees.htm"], ["国家公园非居民费用", "https://www.nps.gov/aboutus/nonresident-fees.htm"], ["大峡谷西缘门票", "https://grandcanyonwest.com/tickets"]] },

  { id: "yellowstone", area: "usa", tag: "5–6 天 · 国家公园", name: "黄石国家公园 Yellowstone", short: "老忠实泉、大棱镜温泉、成群野牛。一部车 $35 玩 7 天。",
    img: "Grand_prismatic_spring.jpg", credit: "Wikimedia Commons",
    budget: "5–6 天每人约 $1,200–1,800（2–4 人拼车）",
    sec: [
      ["为什么去", "美国第一个国家公园，世界上一半以上的间歇泉在这里。能看到喷发的老忠实泉、彩虹色的大棱镜温泉，还有路边慢慢走过的野牛群。"],
      ["怎么去", "• 飞到蒙大拿州 Bozeman（BZN），再开 1 小时 20 分钟到北门。纽瓦克有 United、甘迺迪有 Delta 和 JetBlue 航班（有些是季节性的）。1 月机票最便宜，8 月和 12 月最贵。\n• 盐湖城机票常常最便宜，但要开 5 小时车。\n• 公园里没有公共交通，一定要租车，7–8 月要很早订车。"],
      ["必玩", "• 老忠实泉（Old Faithful）：大约每 90 分钟喷一次，早上去人少。\n• 大棱镜温泉：美国最大的温泉，中午水汽少颜色最清楚，走 Fairy Falls 步道上观景台看全景。\n• 黄石大峡谷：下瀑布约 308 英尺高，Artist Point 角度最好。\n• Lamar 山谷看狼和野牛（早上 6 点前到）；Hayden 山谷看野牛和麋鹿。\n• 猛犸温泉梯田、黄石湖。"],
      ["一定要知道", "• 门票一部车 $35，7 天有效。\n• 2026 年起非美国居民 16 岁以上每人多交 $100。\n• 11 月初到 4 月底大部分路不开放，只有北门到 Cooke City 那段全年开。\n• 公园内的旅馆提前 13 个月就开始订，每月 5 号放房，夏天一定要早订。\n• 千万不要靠近野牛和熊，也不要走出步道，温泉边的地面可能很薄。"],
      ["什么时候去", "6–8 月最适合徒步，但人最多；9 月和春天看动物最好，路也还开着。"],
      ["省钱秘诀", "• 一部车 $35 全车人都包了，几家人拼车最划算。\n• 一年内还要去大峡谷等其他国家公园的，买 $80 的“美丽美国”年票。\n• 国内来的亲戚：买 $250 的非居民年票，可以免掉每人 $100 的附加费。\n• 9 月去，过了旺季，路还开着。\n• 在 Bozeman 超市买好食物带进公园，园内吃饭贵。\n• 美国公民和居民的免费入园日：2026 年还剩 10 月 27 日和 11 月 11 日。"]
    ], src: [["黄石门票", "https://www.nps.gov/yell/planyourvisit/fees.htm"], ["黄石道路开放时间", "https://home.nps.gov/yell/planyourvisit/parkroads.htm"]] },

  { id: "oahu", area: "usa", tag: "6–7 天 · 海岛", name: "夏威夷欧胡岛 Oahu", short: "坐公交一天封顶 $7.50，珍珠港只要 $1，自己订恐龙湾只要 $25。",
    img: "Waikiki_view_from_Diamond_Head.JPG", credit: "Wikimedia Commons",
    budget: "6–7 天每人约 $1,850–2,550（2 人一间房）",
    sec: [
      ["为什么去", "碧海蓝天、威基基海滩、钻石头山看日出、恐龙湾浮潜，还有珍珠港。不用出国就能度一个热带海岛假期。"],
      ["怎么去", "• 甘迺迪有 Delta、Alaska（原夏威夷航空）直飞檀香山（HNL）；纽瓦克的 United 从 2026 年 11 月 20 日到 2027 年 4 月每天直飞，约 11 小时。\n• 1–2 月机票最便宜（来回约 $791），12 月和 7 月最贵。提前约 12 周订。"],
      ["在岛上怎么走", "• 公交车 TheBus：单程 $3.25；用 HOLO 卡（卡费 $2）一天最多扣 $7.50，3 日票 $20，7 日票 $45。\n• 从威基基坐 W 线到机场约 34 分钟，但不能带大行李。\n• 公交已经不去恐龙湾了。\n• 租车便宜（经济型一周约 $259），但威基基酒店停车每晚 $45–72，只在需要出远门的那几天租。"],
      ["必玩", "• 钻石头山：非居民要提前预约（最多提前 30 天），每人 $5，开车进去每部车再加 $10。\n• 恐龙湾（Hanauma Bay）浮潜：非居民 13 岁以上 $25，停车 $3 现金，星期一、二不开。提前 2 天夏威夷时间早上 7 点开放预约，很快抢完。\n• 珍珠港亚利桑那号纪念馆：免费，网上预约每张只收 $1 手续费。\n• 威基基海滩、北岸（冬天大浪，1–3 月可以看鲸鱼）。"],
      ["吃什么", "• Leonard's Bakery（1952 年开）：夏威夷炸面包 Malasada。\n• Rainbow Drive-In（1961 年开）：便当和 Loco Moco。\n• Helena's Hawaiian Food（1946 年开）：正宗夏威夷菜。"],
      ["省钱秘诀", "• 用 HOLO 卡坐公交，一天最多 $7.50。\n• 不要整个星期租车，省下每晚 $45–72 的停车费。\n• 恐龙湾、钻石头山自己上官网订，比报团便宜很多。\n• 4 月中到 6 月初、9 月到 12 月中是淡季，机票酒店都便宜。\n• 去本地人吃的便当店（plate lunch）。\n• 2026 年起夏威夷酒店税提高，订房比价时看含税价。"]
    ], src: [["TheBus 票价", "https://www.thebus.org/Fare202607/FareTran_TheBusFares.asp"], ["恐龙湾", "https://www.honolulu.gov/dpr/hanauma-bay-nature-preserve/"], ["珍珠港预约", "https://www.recreation.gov/ticket/facility/233338"]] },

  { id: "california", area: "usa", tag: "7–8 天 · 自驾", name: "加州：旧金山 + 一号公路 + 洛杉矶", short: "全世界最美的海岸公路之一，2026 年大苏尔路段重新全线通车。",
    img: "Bixby_Creek_Bridge,_California,_USA_-_May_2013.jpg", credit: "David Iliff · CC BY-SA 3.0",
    budget: "7–8 天每人约 $1,650–2,250（2 人拼车同住）",
    sec: [
      ["为什么去", "旧金山的金门大桥和唐人街、一号公路边的悬崖和大海、洛杉矶的好莱坞和海滩，一趟自驾全看到。2026 年 1 月大苏尔塌方路段修好，几年来第一次全线通车。"],
      ["怎么走", "• 飞旧金山（SFO）进，洛杉矶（LAX）出，中间租一部车单程开下来。甘迺迪到旧金山有 Delta、JetBlue、American、Alaska 直飞，1 月最便宜（来回约 $306）。\n• 一号公路慢慢开要 5–7 天，沿途停：蒙特雷和卡梅尔、比克斯比大桥、McWay 瀑布、赫氏古堡（要预约）、莫罗湾、圣塔芭芭拉。\n• 出发前上加州交通局（Caltrans）网站查路况，偶尔还会封路。"],
      ["旧金山", "• 走金门大桥：免费，东侧人行道早 5 点到晚 6:30 开放。\n• 免费景点：Lands End 海岸步道、“彩绘女士”老房子、唐人街、金门公园。\n• 恶魔岛（Alcatraz）监狱：成人 $47.95，只能在官方 Alcatraz City Cruises 买，最多提前 90 天订，常常卖光。\n• 公交 Muni 单程 $2.85；叮当车 $9；游客通票 1 天 $15、3 天 $35（含叮当车）。"],
      ["洛杉矶", "• 盖蒂中心（Getty Center）：免费入场，停车 $25，下午 3 点后只要 $15。\n• 格里菲斯天文台：免费，看好莱坞大字和洛杉矶夜景。\n• The Broad 当代美术馆：免费。"],
      ["吃什么", "• 旧金山：La Taqueria 的墨西哥大卷饼、Boudin 的酸面包碗装蛤蜊浓汤。\n• 洛杉矶：Philippe（1908 年开）的法式蘸汁三明治、Langer's（1947 年开）的 19 号烟熏牛肉三明治。"],
      ["省钱秘诀", "• 一进一出两个机场，不走回头路，早订机票。\n• 旧金山不要开车，停车贵又难找，买游客通票坐公交和叮当车。\n• 免费景点和博物馆很多。\n• 盖蒂中心下午 3 点后去，停车便宜 $10。\n• 恶魔岛只在官网买，别在街上买黄牛票。\n• 晚春和早秋去，天气好、价格合理（夏天沿海常有雾）。"]
    ], src: [["加州交通局 大苏尔通车", "https://dot.ca.gov/caltrans-near-me/district-5/d5-news/d5-news-1-14-26"], ["旧金山公交票价", "https://www.sfmta.com/getting-around/muni/fares"], ["恶魔岛门票", "https://www.nps.gov/alca/planyourvisit/fees.htm"]] }
  ];
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const imgTag = (t, cls) => t.img ? `<img class="${cls}" src="${FP(t.img)}" alt="${esc(t.name)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'${cls} tr-ph'}))">` : `<div class="${cls} tr-ph"></div>`;
  function hub(area) {
    const grp = [["near", "纽约周边", "一日游、周末游，坐巴士火车就能去"], ["usa", "美国境内", "飞过去玩几天，省钱攻略一次看懂"]].filter(g => !area || g[0] === area);
    return `<div class="tr-hero"><h1>玩转美国</h1><p>纽约出发的省钱旅游攻略：怎么去最便宜、哪些景点免费、吃什么、什么时候去。白话写给大家看。</p></div>` +
      grp.map(([k, n, d]) => `<section class="tr-grp"><div class="tr-gh"><h2>${esc(n)}</h2><span>${esc(d)}</span></div><div class="tr-grid">${T.filter(t => t.area === k).map(t => `<a class="tr-card" href="#tr-${t.id}">${imgTag(t, "tr-img")}<div class="tr-cb"><span class="tr-tag">${esc(t.tag)}</span><b>${esc(t.name)}</b><p>${esc(t.short)}</p></div></a>`).join("")}</div></section>`).join("") +
      `<p class="tl-note">价格和时间是 2026 年 10 月查到的，会变动，出发前请上官网确认。</p>`;
  }
  const para = txt => txt.split("\n").map(l => l.startsWith("• ") ? `<li>${esc(l.slice(2))}</li>` : `<p>${esc(l)}</p>`).join("").replace(/(<li>.*?<\/li>)+/g, m => `<ul>${m}</ul>`);
  function page(id) {
    const t = T.find(x => x.id === id); if (!t) return null;
    const others = T.filter(x => x.area === t.area && x.id !== t.id).slice(0, 3);
    return `<article class="tr-art"><div class="tr-top">${imgTag(t, "tr-big")}${t.img ? `<a class="tr-credit" href="${PG(t.img)}" target="_blank" rel="noopener">图片：${esc(t.credit)}</a>` : ""}</div>
      <span class="tr-tag">${esc(t.tag)}</span><h1>${esc(t.name)}</h1><p class="tr-lead">${esc(t.short)}</p>
      <div class="tr-budget"><b>省钱预算</b><span>${esc(t.budget)}</span></div>
      ${t.sec.map(([h, txt]) => `<section class="tr-sec"><h2>${esc(h)}</h2>${para(txt)}</section>`).join("")}
      <p class="tl-note">价格和开放时间是 2026 年 10 月查到的，可能变动，出发前请上官网确认。住宿、吃饭的预算是估算。参考：${t.src.map(([n, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(n)}</a>`).join("、")}</p>
      <div class="tr-act"><button type="button" class="btn wx-btn" data-trshare="${esc(t.id)}">分享给朋友</button><a class="btn ghost" href="#travel">全部攻略</a></div>
      ${others.length ? `<h2 class="tr-more">更多${t.area === "near" ? "纽约周边" : "美国境内"}攻略</h2><div class="tr-grid">${others.map(o => `<a class="tr-card" href="#tr-${o.id}">${imgTag(o, "tr-img")}<div class="tr-cb"><span class="tr-tag">${esc(o.tag)}</span><b>${esc(o.name)}</b></div></a>`).join("")}</div>` : ""}</article>`;
  }
  window.HLTravel = { T, hub, page, title: id => (T.find(x => x.id === id) || {}).name || "" };
})();
