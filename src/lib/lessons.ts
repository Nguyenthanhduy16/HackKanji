import audioManifest from '../../public/lessons/audio-manifest.json';

export type JlptLevel='N5'|'N4'|'N3'|'N2'|'N1';
export type LessonMode='practice'|'listening'|'speaking';
export type CategoryId='daily'|'travel'|'stories'|'work'|'jlpt';
export type LessonWord={text:string;reading:string;translation:string};
export type LessonSentence={id:string;text:string;reading:string;translation:string;words:LessonWord[];audio:string|null;duration:number;startSec?:number;endSec?:number};
export type Lesson={id:string;title:string;titleJa:string;level:JlptLevel;category:CategoryId;duration:number;image:string;plays:number;source:'AUDIO'|'YOUTUBE';youtubeId?:string;tags:string[];sentences:LessonSentence[]};
export type LessonCategory={id:CategoryId;titleJa:string;labelKey:string};
export const categories:LessonCategory[]=[
  {id:'daily',titleJa:'日常会話',labelKey:'categoryDaily'},
  {id:'travel',titleJa:'旅行',labelKey:'categoryTravel'},
  {id:'stories',titleJa:'小さな物語',labelKey:'categoryStories'},
  {id:'work',titleJa:'ビジネス日本語',labelKey:'categoryWork'},
  {id:'jlpt',titleJa:'JLPT',labelKey:'categoryJlpt'},
];

type SentenceSeed=[string,string];
type LessonSeed=[string,string,string,JlptLevel,CategoryId,string[],SentenceSeed[]];
// Original short scripts written for NhaiKanji. No reference transcripts or media.
// Word notation is surface~reading~Vietnamese meaning, separated by |.
const seed:LessonSeed[]=[
  ['morning-coffee','Một buổi sáng thật chậm','朝の小さな習慣','N5','daily',['daily','cooking'],[
    ['おはよう~おはよう~chào buổi sáng|ございます~ございます~cách nói lịch sự','Chào buổi sáng.'],
    ['私~わたし~tôi|は~は~trợ từ chủ đề|毎朝~まいあさ~mỗi sáng|コーヒー~こーひー~cà phê|を~を~trợ từ tân ngữ|飲みます~のみます~uống','Mỗi sáng tôi uống cà phê.'],
    ['今日~きょう~hôm nay|も~も~cũng|いい~いい~tốt đẹp|一日~いちにち~một ngày|に~に~trợ từ kết quả|しましょう~しましょう~hãy làm cho','Hôm nay cũng hãy có một ngày tốt đẹp nhé.'],
  ]],
  ['rainy-bookshop','Trú mưa trong hiệu sách','雨の日の本屋','N4','daily',['daily','podcast'],[
    ['雨~あめ~mưa|が~が~trợ từ chủ ngữ|降って~ふって~đang rơi|いる~いる~tiếp diễn|ので~ので~vì|本屋~ほんや~hiệu sách|に~に~đến|入りました~はいりました~đã vào','Vì trời đang mưa nên tôi vào một hiệu sách.'],
    ['窓~まど~cửa sổ|の~の~của|近く~ちかく~gần|で~で~ở|旅行~りょこう~du lịch|の~の~về|本~ほん~sách|を~を~trợ từ tân ngữ|読みました~よみました~đã đọc','Tôi đọc một cuốn sách du lịch bên cửa sổ.'],
    ['雨~あめ~mưa|の~の~của|音~おと~âm thanh|を~を~trợ từ tân ngữ|聞きながら~ききながら~vừa nghe|ゆっくり~ゆっくり~thong thả|過ごしました~すごしました~đã tận hưởng thời gian','Tôi thong thả tận hưởng thời gian trong tiếng mưa.'],
  ]],
  ['neighbour-garden','Khu vườn của người hàng xóm','隣の小さな庭','N3','daily',['daily','podcast'],[
    ['隣~となり~bên cạnh|の~の~của|人~ひと~người|に~に~từ|野菜~やさい~rau|の~の~của|育て方~そだてかた~cách trồng|を~を~trợ từ tân ngữ|教えて~おしえて~chỉ dạy|もらいました~もらいました~được','Tôi được người hàng xóm chỉ cách trồng rau.'],
    ['毎日~まいにち~mỗi ngày|水~みず~nước|を~を~trợ từ tân ngữ|やれば~やれば~nếu tưới|いい~いい~tốt|という~という~rằng|わけではありません~わけではありません~không hẳn là','Không phải cứ tưới nước mỗi ngày là tốt.'],
    ['葉~は~lá|の~の~của|様子~ようす~tình trạng|を~を~trợ từ tân ngữ|よく~よく~kỹ|見る~みる~quan sát|こと~こと~việc|が~が~trợ từ chủ ngữ|大切~たいせつ~quan trọng|だそうです~だそうです~nghe nói','Nghe nói điều quan trọng là quan sát kỹ tình trạng của lá.'],
  ]],
  ['quiet-weekend','Khoảng lặng cuối tuần','何もしない休日','N2','daily',['daily','podcast'],[
    ['予定~よてい~kế hoạch|を~を~trợ từ tân ngữ|詰め込みすぎた~つめこみすぎた~nhồi nhét quá nhiều|せいで~せいで~bởi vì|休日~きゅうじつ~ngày nghỉ|まで~まで~đến cả|忙しく~いそがしく~bận rộn|なってしまいました~なってしまいました~đã trở nên','Vì xếp quá nhiều kế hoạch, cả ngày nghỉ của tôi cũng trở nên bận rộn.'],
    ['そこで~そこで~vì vậy|今週~こんしゅう~tuần này|は~は~trợ từ chủ đề|あえて~あえて~chủ động|何も~なにも~không gì|決めない~きめない~không quyết định|ことにしました~ことにしました~đã quyết định','Vì vậy tuần này tôi chủ động không lên lịch gì cả.'],
    ['心~こころ~tâm trí|に~に~trong|余裕~よゆう~khoảng trống|が~が~trợ từ chủ ngữ|できる~できる~có được|と~と~khi|身近な~みぢかな~gần gũi|景色~けしき~cảnh vật|も~も~cũng|違って~ちがって~khác đi|見えます~みえます~trông thấy','Khi tâm trí có khoảng trống, cảnh vật thân quen cũng trông khác đi.'],
  ]],
  ['meaning-of-home','Điều làm nên một mái nhà','居場所を考える','N1','daily',['daily','podcast'],[
    ['居場所~いばしょ~nơi thuộc về|とは~とは~nói đến|単に~たんに~đơn thuần|住む~すむ~sinh sống|場所~ばしょ~nơi chốn|を~を~trợ từ tân ngữ|指す~さす~chỉ|のではない~のではない~không phải','Nơi thuộc về không đơn thuần chỉ một chỗ để sống.'],
    ['ありのまま~ありのまま~đúng như vốn có|の~の~của|自分~じぶん~bản thân|を~を~trợ từ tân ngữ|受け入れて~うけいれて~chấp nhận|もらえる~もらえる~được|こと~こと~việc|が~が~trợ từ chủ ngữ|欠かせない~かかせない~không thể thiếu','Điều không thể thiếu là được đón nhận con người thật của mình.'],
    ['だからこそ~だからこそ~chính vì thế|何気ない~なにげない~bình dị|挨拶~あいさつ~lời chào|にも~にも~ngay cả trong|人~ひと~con người|を~を~trợ từ tân ngữ|支える~ささえる~nâng đỡ|力~ちから~sức mạnh|が~が~trợ từ chủ ngữ|ある~ある~có','Chính vì thế, một lời chào bình dị cũng có sức nâng đỡ con người.'],
  ]],
  ['market-basket','Giỏ rau sáng chủ nhật','日曜日の買い物','N5','daily',['daily','cooking'],[
    ['これ~これ~cái này|は~は~trợ từ chủ đề|いくら~いくら~bao nhiêu tiền|ですか~ですか~câu hỏi lịch sự','Cái này giá bao nhiêu ạ?'],
    ['トマト~とまと~cà chua|を~を~trợ từ tân ngữ|三つ~みっつ~ba cái|ください~ください~xin hãy cho','Cho tôi ba quả cà chua.'],
    ['家~いえ~nhà|で~で~ở|サラダ~さらだ~salad|を~を~trợ từ tân ngữ|作ります~つくります~làm','Tôi sẽ làm salad ở nhà.'],
  ]],
  ['station-ticket','Chiếc vé đến biển','海へ行く切符','N5','travel',['travel','daily'],[
    ['駅~えき~nhà ga|は~は~trợ từ chủ đề|どこ~どこ~ở đâu|ですか~ですか~câu hỏi lịch sự','Nhà ga ở đâu ạ?'],
    ['海~うみ~biển|まで~まで~đến|の~の~của|切符~きっぷ~vé|を~を~trợ từ tân ngữ|買います~かいます~mua','Tôi mua vé đi đến biển.'],
    ['電車~でんしゃ~tàu điện|は~は~trợ từ chủ đề|九時~くじ~chín giờ|に~に~lúc|出ます~でます~khởi hành','Tàu khởi hành lúc chín giờ.'],
  ]],
  ['kyoto-bicycle','Đạp xe qua Kyoto','京都を自転車で','N4','travel',['travel','history'],[
    ['京都~きょうと~Kyoto|で~で~ở|自転車~じてんしゃ~xe đạp|を~を~trợ từ tân ngữ|借りました~かりました~đã thuê','Tôi thuê xe đạp ở Kyoto.'],
    ['川~かわ~sông|に~に~theo|沿って~そって~dọc theo|走る~はしる~đạp xe|と~と~khi|古い~ふるい~cũ|橋~はし~cầu|が~が~trợ từ chủ ngữ|見えました~みえました~đã nhìn thấy','Đạp dọc bờ sông, tôi nhìn thấy một cây cầu cổ.'],
    ['帰る~かえる~trở về|前~まえ~trước|に~に~lúc|小さな~ちいさな~nhỏ|店~みせ~cửa hàng|で~で~ở|お茶~おちゃ~trà|を~を~trợ từ tân ngữ|飲みました~のみました~đã uống','Trước khi về, tôi uống trà ở một quán nhỏ.'],
  ]],
  ['island-postcard','Tấm bưu thiếp từ đảo nhỏ','島からの便り','N3','travel',['travel','podcast'],[
    ['船~ふね~thuyền|が~が~trợ từ chủ ngữ|港~みなと~cảng|に~に~đến|着く~つく~cập bến|と~と~khi|潮~しお~biển|の~の~của|香り~かおり~hương|が~が~trợ từ chủ ngữ|しました~しました~cảm thấy','Khi thuyền cập cảng, tôi ngửi thấy hương biển.'],
    ['島~しま~đảo|には~には~ở|信号~しんごう~đèn giao thông|が~が~trợ từ chủ ngữ|一つ~ひとつ~một cái|しか~しか~chỉ|ない~ない~không có|そうです~そうです~nghe nói','Nghe nói trên đảo chỉ có một đèn giao thông.'],
    ['旅~たび~chuyến đi|の~の~của|思い出~おもいで~kỷ niệm|を~を~trợ từ tân ngữ|忘れない~わすれない~không quên|ように~ように~để|葉書~はがき~bưu thiếp|を~を~trợ từ tân ngữ|書きました~かきました~đã viết','Tôi viết bưu thiếp để không quên những kỷ niệm của chuyến đi.'],
  ]],
  ['slow-travel','Đi chậm để thấy nhiều hơn','遠回りの楽しみ','N2','travel',['travel','history'],[
    ['最短~さいたん~ngắn nhất|の~の~của|道~みち~con đường|を~を~trợ từ tân ngữ|選ぶ~えらぶ~chọn|代わりに~かわりに~thay vì|旧道~きゅうどう~đường cũ|を~を~trợ từ tân ngữ|歩いて~あるいて~đi bộ|みました~みました~đã thử','Thay vì chọn đường ngắn nhất, tôi thử đi bộ trên con đường cũ.'],
    ['地図~ちず~bản đồ|には~には~trên|載っていない~のっていない~không có|泉~いずみ~suối|を~を~trợ từ tân ngữ|偶然~ぐうぜん~tình cờ|見つけました~みつけました~đã tìm thấy','Tôi tình cờ tìm thấy một con suối không có trên bản đồ.'],
    ['効率~こうりつ~hiệu quả|ばかり~ばかり~chỉ|を~を~trợ từ tân ngữ|求めて~もとめて~theo đuổi|いては~いては~nếu cứ|出会えない~であえない~không thể gặp|景色~けしき~cảnh vật|も~も~cũng|あります~あります~có','Có những cảnh đẹp ta không gặp được nếu chỉ chạy theo hiệu quả.'],
  ]],
  ['mountain-keepers','Những người giữ núi','山道を守る人々','N1','travel',['travel','news'],[
    ['登山道~とざんどう~đường leo núi|の~の~của|整備~せいび~bảo dưỡng|は~は~trợ từ chủ đề|地道な~じみちな~bền bỉ|努力~どりょく~nỗ lực|の~の~của|積み重ね~つみかさね~sự tích lũy|にほかならない~にほかならない~chính là','Việc bảo dưỡng đường núi chính là thành quả của những nỗ lực bền bỉ.'],
    ['利用者~りようしゃ~người sử dụng|が~が~trợ từ chủ ngữ|増える~ふえる~tăng|につれて~につれて~cùng với|自然~しぜん~thiên nhiên|への~への~đối với|負荷~ふか~gánh nặng|も~も~cũng|無視できなくなる~むしできなくなる~không thể bỏ qua','Khi số người sử dụng tăng, tác động lên thiên nhiên cũng không thể bỏ qua.'],
    ['訪れる~おとずれる~ghé thăm|側~がわ~phía|にも~にも~cũng|景観~けいかん~cảnh quan|を~を~trợ từ tân ngữ|守る~まもる~bảo vệ|責任~せきにん~trách nhiệm|が~が~trợ từ chủ ngữ|問われている~とわれている~đang được đặt ra','Trách nhiệm bảo vệ cảnh quan cũng đang được đặt ra với người ghé thăm.'],
  ]],
  ['lost-umbrella','Chiếc ô ở nhà ga','駅に忘れた傘','N4','travel',['travel','daily'],[
    ['電車~でんしゃ~tàu điện|に~に~trên|傘~かさ~ô|を~を~trợ từ tân ngữ|忘れて~わすれて~quên|しまいました~しまいました~lỡ làm','Tôi lỡ để quên ô trên tàu.'],
    ['駅員~えきいん~nhân viên nhà ga|さん~さん~cách gọi lịch sự|に~に~với|色~いろ~màu sắc|と~と~và|形~かたち~hình dáng|を~を~trợ từ tân ngữ|説明しました~せつめいしました~đã giải thích','Tôi mô tả màu sắc và hình dáng cho nhân viên nhà ga.'],
    ['次~つぎ~tiếp theo|の~の~của|駅~えき~ga|で~で~ở|見つかった~みつかった~đã tìm thấy|ので~ので~vì|安心しました~あんしんしました~đã yên tâm','Tôi yên tâm vì chiếc ô được tìm thấy ở ga tiếp theo.'],
  ]],
  ['cat-window','Chú mèo bên cửa sổ','窓辺の猫','N5','stories',['kids','anime','stories'],[
    ['白い~しろい~màu trắng|猫~ねこ~mèo|が~が~trợ từ chủ ngữ|います~います~có','Có một chú mèo trắng.'],
    ['猫~ねこ~mèo|は~は~trợ từ chủ đề|窓~まど~cửa sổ|の~の~của|外~そと~bên ngoài|を~を~trợ từ tân ngữ|見ます~みます~nhìn','Chú mèo nhìn ra ngoài cửa sổ.'],
    ['小さな~ちいさな~nhỏ|鳥~とり~chim|が~が~trợ từ chủ ngữ|来ました~きました~đã đến','Một chú chim nhỏ bay tới.'],
  ]],
  ['little-lantern','Chiếc đèn nhỏ trong rừng','森の小さな灯り','N4','stories',['kids','folktales','stories'],[
    ['男の子~おとこのこ~cậu bé|は~は~trợ từ chủ đề|森~もり~rừng|で~で~trong|道~みち~đường|に~に~trợ từ|迷いました~まよいました~đã lạc','Cậu bé bị lạc trong rừng.'],
    ['遠く~とおく~phía xa|に~に~ở|小さな~ちいさな~nhỏ|灯り~あかり~ánh đèn|が~が~trợ từ chủ ngữ|見えました~みえました~đã nhìn thấy','Cậu nhìn thấy một ánh đèn nhỏ ở phía xa.'],
    ['そこ~そこ~nơi đó|には~には~ở|おばあさん~おばあさん~bà cụ|の~の~của|温かい~あたたかい~ấm áp|家~いえ~ngôi nhà|が~が~trợ từ chủ ngữ|ありました~ありました~đã có','Ở đó có ngôi nhà ấm áp của một bà cụ.'],
  ]],
  ['paper-bird','Cánh chim bằng giấy','紙の鳥の旅','N3','stories',['stories','anime','kids'],[
    ['少女~しょうじょ~cô bé|が~が~trợ từ chủ ngữ|折った~おった~đã gấp|紙~かみ~giấy|の~の~bằng|鳥~とり~chim|は~は~trợ từ chủ đề|風~かぜ~gió|に~に~theo|乗って~のって~cưỡi lên|飛びました~とびました~đã bay','Chú chim giấy cô bé gấp bay theo gió.'],
    ['屋根~やね~mái nhà|を~を~qua|越える~こえる~vượt qua|と~と~khi|町~まち~thị trấn|全体~ぜんたい~toàn bộ|が~が~trợ từ chủ ngữ|見えました~みえました~đã nhìn thấy','Vượt qua mái nhà, chú nhìn thấy cả thị trấn.'],
    ['鳥~とり~chim|は~は~trợ từ chủ đề|いつか~いつか~một ngày nào đó|少女~しょうじょ~cô bé|の~の~của|もと~もと~bên cạnh|へ~へ~đến|帰ろう~かえろう~sẽ về|と~と~rằng|思いました~おもいました~đã nghĩ','Chú chim nghĩ một ngày nào đó sẽ trở về bên cô bé.'],
  ]],
  ['moon-baker','Tiệm bánh dưới ánh trăng','月夜のパン屋','N2','stories',['stories','folktales','cooking'],[
    ['町~まち~thị trấn|が~が~trợ từ chủ ngữ|眠り~ねむり~ngủ|に~に~vào|つく~つく~chìm|ころ~ころ~khoảng lúc|一軒~いっけん~một căn|の~の~của|パン屋~ぱんや~tiệm bánh|に~に~ở|明かり~あかり~ánh đèn|が~が~trợ từ chủ ngữ|ともった~ともった~đã sáng lên','Khi thị trấn chìm vào giấc ngủ, một tiệm bánh sáng đèn.'],
    ['店主~てんしゅ~chủ tiệm|は~は~trợ từ chủ đề|誰~だれ~ai|に~に~với|頼まれる~たのまれる~được nhờ|でもなく~でもなく~không phải|生地~きじ~bột bánh|を~を~trợ từ tân ngữ|こねていた~こねていた~đang nhào','Chẳng ai nhờ nhưng người chủ tiệm vẫn đang nhào bột.'],
    ['朝~あさ~buổi sáng|を~を~trợ từ tân ngữ|待つ~まつ~chờ|人々~ひとびと~mọi người|にとって~にとって~đối với|その~その~đó|香り~かおり~mùi hương|は~は~trợ từ chủ đề|希望~きぼう~hy vọng|だった~だった~đã là','Với những người chờ bình minh, mùi bánh ấy là hy vọng.'],
  ]],
  ['clockmaker','Người sửa những chiếc đồng hồ','時計職人の約束','N1','stories',['stories','folktales','history'],[
    ['老いた~おいた~già|職人~しょくにん~nghệ nhân|は~は~trợ từ chủ đề|壊れた~こわれた~hỏng|時計~とけい~đồng hồ|を~を~trợ từ tân ngữ|前にして~まえにして~đứng trước|静かに~しずかに~lặng lẽ|ほほえんだ~ほほえんだ~mỉm cười','Người thợ già lặng lẽ mỉm cười trước chiếc đồng hồ hỏng.'],
    ['時~とき~thời gian|を~を~trợ từ tân ngữ|戻す~もどす~quay ngược|こと~こと~việc|は~は~trợ từ chủ đề|できずとも~できずとも~dẫu không thể|思い出~おもいで~kỷ niệm|まで~まで~đến cả|失われる~うしなわれる~mất đi|わけではない~わけではない~không có nghĩa là','Dẫu không thể quay ngược thời gian, không có nghĩa kỷ niệm cũng mất đi.'],
    ['その~その~đó|言葉~ことば~lời nói|に~に~trong|込められた~こめられた~chất chứa|優しさ~やさしさ~sự dịu dàng|を~を~trợ từ tân ngữ|少年~しょうねん~cậu bé|は~は~trợ từ chủ đề|生涯~しょうがい~suốt đời|忘れなかった~わすれなかった~không quên','Cậu bé suốt đời không quên sự dịu dàng trong những lời ấy.'],
  ]],
  ['rooftop-melody','Giai điệu trên mái nhà','屋上のメロディー','N3','stories',['stories','music','anime'],[
    ['放課後~ほうかご~sau giờ học|に~に~lúc|屋上~おくじょう~sân thượng|へ~へ~đến|行く~いく~đi|と~と~khi|笛~ふえ~sáo|の~の~của|音~おと~tiếng|が~が~trợ từ chủ ngữ|聞こえました~きこえました~đã nghe thấy','Lên sân thượng sau giờ học, tôi nghe thấy tiếng sáo.'],
    ['友達~ともだち~người bạn|は~は~trợ từ chủ đề|自分~じぶん~bản thân|で~で~tự|作った~つくった~sáng tác|曲~きょく~bản nhạc|を~を~trợ từ tân ngữ|練習していました~れんしゅうしていました~đang tập','Người bạn đang tập bản nhạc do chính mình sáng tác.'],
    ['間違えても~まちがえても~dù chơi sai|楽しそうに~たのしそうに~vui vẻ|吹く~ふく~thổi|姿~すがた~dáng vẻ|を~を~trợ từ tân ngữ|見て~みて~nhìn|私~わたし~tôi|も~も~cũng|笑顔~えがお~nụ cười|になりました~になりました~đã trở nên','Thấy bạn vẫn thổi sáo vui vẻ dù chơi sai, tôi cũng mỉm cười.'],
  ]],
  ['first-day','Ngày đầu ở công ty','はじめての職場','N5','work',['work','daily'],[
    ['はじめまして~はじめまして~rất vui được gặp','Rất vui được gặp mọi người.'],
    ['私~わたし~tôi|は~は~trợ từ chủ đề|リン~りん~Linh|です~です~là','Tôi là Linh.'],
    ['どうぞ~どうぞ~xin hãy|よろしく~よろしく~giúp đỡ|お願いします~おねがいします~mong được','Rất mong nhận được sự giúp đỡ của mọi người.'],
  ]],
  ['meeting-room','Một cuộc hẹn nhỏ','会議室の予約','N4','work',['work','jlpt'],[
    ['明日~あした~ngày mai|の~の~của|会議~かいぎ~cuộc họp|は~は~trợ từ chủ đề|何時~なんじ~mấy giờ|から~から~từ|ですか~ですか~câu hỏi lịch sự','Cuộc họp ngày mai bắt đầu lúc mấy giờ?'],
    ['午後~ごご~buổi chiều|二時~にじ~hai giờ|から~から~từ|三時~さんじ~ba giờ|まで~まで~đến|です~です~là','Từ hai giờ đến ba giờ chiều.'],
    ['資料~しりょう~tài liệu|を~を~trợ từ tân ngữ|十部~じゅうぶ~mười bản|コピーして~こぴーして~sao chép|おきます~おきます~chuẩn bị sẵn','Tôi sẽ chuẩn bị sẵn mười bản tài liệu.'],
  ]],
  ['kind-feedback','Góp ý để cùng tiến bộ','伝わるフィードバック','N3','work',['work','podcast'],[
    ['意見~いけん~ý kiến|を~を~trợ từ tân ngữ|伝える~つたえる~truyền đạt|とき~とき~khi|は~は~trợ từ chủ đề|具体的な~ぐたいてきな~cụ thể|例~れい~ví dụ|を~を~trợ từ tân ngữ|挙げる~あげる~nêu ra|ようにしています~ようにしています~cố gắng thường xuyên','Khi góp ý, tôi cố gắng nêu ví dụ cụ thể.'],
    ['相手~あいて~đối phương|の~の~của|話~はなし~câu chuyện|も~も~cũng|最後~さいご~cuối cùng|まで~まで~đến|聞く~きく~nghe|こと~こと~việc|が~が~trợ từ chủ ngữ|大事~だいじ~quan trọng|です~です~là','Việc lắng nghe đối phương nói hết cũng rất quan trọng.'],
    ['一緒に~いっしょに~cùng nhau|考えれば~かんがえれば~nếu suy nghĩ|もっと~もっと~hơn nữa|いい~いい~tốt|方法~ほうほう~phương pháp|が~が~trợ từ chủ ngữ|見つかる~みつかる~tìm thấy|はずです~はずです~chắc sẽ','Nếu cùng suy nghĩ, chắc chắn sẽ tìm được cách tốt hơn.'],
  ]],
  ['remote-team','Gần nhau dù làm việc xa','離れて働くチーム','N2','work',['work','news'],[
    ['在宅勤務~ざいたくきんむ~làm việc tại nhà|が~が~trợ từ chủ ngữ|広がる~ひろがる~phổ biến|一方で~いっぽうで~mặt khác|情報共有~じょうほうきょうゆう~chia sẻ thông tin|の~の~của|難しさ~むずかしさ~khó khăn|も~も~cũng|指摘されている~してきされている~được chỉ ra','Làm việc tại nhà phổ biến hơn, đồng thời khó khăn khi chia sẻ thông tin cũng được chỉ ra.'],
    ['雑談~ざつだん~trò chuyện|の~の~của|機会~きかい~cơ hội|を~を~trợ từ tân ngữ|設ける~もうける~tạo ra|ことで~ことで~bằng việc|互い~たがい~nhau|の~の~của|状況~じょうきょう~tình hình|が~が~trợ từ chủ ngữ|分かりやすくなる~わかりやすくなる~dễ hiểu hơn','Tạo cơ hội trò chuyện giúp mọi người hiểu tình hình của nhau hơn.'],
    ['距離~きょり~khoảng cách|に~に~bởi|左右されない~さゆうされない~không bị chi phối|信頼関係~しんらいかんけい~quan hệ tin cậy|を~を~trợ từ tân ngữ|築きたい~きずきたい~muốn xây dựng','Chúng tôi muốn xây dựng lòng tin không bị khoảng cách chi phối.'],
  ]],
  ['responsible-design','Thiết kế có trách nhiệm','使う人を中心に','N1','work',['work','news'],[
    ['利便性~りべんせい~sự tiện lợi|の~の~của|追求~ついきゅう~theo đuổi|のみならず~のみならず~không chỉ|利用者~りようしゃ~người dùng|への~への~đối với|配慮~はいりょ~sự quan tâm|も~も~cũng|求められる~もとめられる~được yêu cầu','Không chỉ theo đuổi tiện lợi, thiết kế còn cần quan tâm đến người dùng.'],
    ['設計~せっけい~thiết kế|の~の~của|段階~だんかい~giai đoạn|から~から~từ|多様な~たような~đa dạng|立場~たちば~vị trí|を~を~trợ từ tân ngữ|想定して~そうていして~hình dung|おく~おく~sẵn|べきだ~べきだ~nên','Ngay từ giai đoạn thiết kế, cần tính đến những hoàn cảnh đa dạng.'],
    ['小さな~ちいさな~nhỏ|改善~かいぜん~cải tiến|の~の~của|積み重ね~つみかさね~sự tích lũy|こそ~こそ~chính|が~が~trợ từ chủ ngữ|長期的な~ちょうきてきな~dài hạn|価値~かち~giá trị|を~を~trợ từ tân ngữ|生む~うむ~tạo ra','Chính những cải tiến nhỏ tích lũy tạo ra giá trị dài hạn.'],
  ]],
  ['project-handoff','Bàn giao thật rõ ràng','引き継ぎの工夫','N2','work',['work','jlpt'],[
    ['担当者~たんとうしゃ~người phụ trách|が~が~trợ từ chủ ngữ|変わる~かわる~thay đổi|にあたって~にあたって~nhân dịp|手順~てじゅん~quy trình|を~を~trợ từ tân ngữ|見直した~みなおした~đã xem xét lại','Khi thay đổi người phụ trách, chúng tôi xem xét lại quy trình.'],
    ['文書~ぶんしょ~văn bản|を~を~trợ từ tân ngữ|残す~のこす~để lại|だけでなく~だけでなく~không chỉ|実際に~じっさいに~thực tế|作業~さぎょう~công việc|を~を~trợ từ tân ngữ|見せる~みせる~cho xem|ことにした~ことにした~quyết định','Chúng tôi quyết định không chỉ để lại văn bản mà còn minh họa công việc thực tế.'],
    ['疑問~ぎもん~thắc mắc|を~を~trợ từ tân ngữ|その場~そのば~ngay tại chỗ|で~で~ở|解消できる~かいしょうできる~có thể giải đáp|ため~ため~vì|引き継ぎ~ひきつぎ~bàn giao|が~が~trợ từ chủ ngữ|円滑に~えんかつに~suôn sẻ|進んだ~すすんだ~đã tiến triển','Nhờ giải đáp thắc mắc ngay tại chỗ, việc bàn giao diễn ra suôn sẻ.'],
  ]],
  ['library-promise','Hẹn nhau ở thư viện','図書館で会いましょう','N5','jlpt',['jlpt','kids'],[
    ['土曜日~どようび~thứ bảy|に~に~vào|図書館~としょかん~thư viện|へ~へ~đến|行きます~いきます~đi','Thứ bảy tôi sẽ đến thư viện.'],
    ['一緒に~いっしょに~cùng nhau|日本語~にほんご~tiếng Nhật|を~を~trợ từ tân ngữ|勉強しませんか~べんきょうしませんか~cùng học nhé','Cùng học tiếng Nhật nhé?'],
    ['入口~いりぐち~lối vào|で~で~ở|待っています~まっています~đang đợi','Tôi sẽ đợi ở lối vào.'],
  ]],
  ['lunch-choice','Hôm nay ăn gì?','昼ご飯を選ぶ','N4','jlpt',['jlpt','cooking'],[
    ['この~この~này|店~みせ~quán|の~の~của|定食~ていしょく~cơm phần|は~は~trợ từ chủ đề|安くて~やすくて~rẻ và|おいしい~おいしい~ngon|です~です~là','Cơm phần của quán này vừa rẻ vừa ngon.'],
    ['魚~さかな~cá|と~と~và|肉~にく~thịt|の~の~của|どちら~どちら~bên nào|が~が~trợ từ chủ ngữ|好き~すき~thích|ですか~ですか~câu hỏi lịch sự','Bạn thích cá hay thịt hơn?'],
    ['昨日~きのう~hôm qua|肉~にく~thịt|を~を~trợ từ tân ngữ|食べた~たべた~đã ăn|ので~ので~vì|今日~きょう~hôm nay|は~は~trợ từ chủ đề|魚~さかな~cá|にします~にします~chọn','Hôm qua đã ăn thịt nên hôm nay tôi chọn cá.'],
  ]],
  ['study-rhythm','Nhịp học của riêng mình','無理のない勉強','N3','jlpt',['jlpt','podcast'],[
    ['毎日~まいにち~mỗi ngày|少しずつ~すこしずつ~từng chút|勉強する~べんきょうする~học|ように~ように~để|しています~しています~cố gắng','Tôi cố gắng học từng chút mỗi ngày.'],
    ['覚えた~おぼえた~đã nhớ|言葉~ことば~từ vựng|は~は~trợ từ chủ đề|すぐに~すぐに~ngay|使って~つかって~sử dụng|みる~みる~thử|ことにしています~ことにしています~đặt thành thói quen','Tôi tạo thói quen thử dùng ngay từ vừa học.'],
    ['続ける~つづける~tiếp tục|うちに~うちに~trong lúc|聞き取れる~ききとれる~nghe hiểu được|表現~ひょうげん~cách diễn đạt|が~が~trợ từ chủ ngữ|増えてきました~ふえてきました~dần tăng lên','Khi duy trì, số cách diễn đạt tôi nghe hiểu được dần tăng lên.'],
  ]],
  ['shared-bicycles','Xe đạp dùng chung trong phố','街の自転車シェア','N2','jlpt',['jlpt','news','travel'],[
    ['自転車~じてんしゃ~xe đạp|の~の~của|共有サービス~きょうゆうさーびす~dịch vụ dùng chung|は~は~trợ từ chủ đề|移動~いどう~di chuyển|の~の~của|選択肢~せんたくし~lựa chọn|を~を~trợ từ tân ngữ|広げる~ひろげる~mở rộng','Dịch vụ xe đạp dùng chung mở rộng lựa chọn đi lại.'],
    ['便利な~べんりな~tiện lợi|反面~はんめん~mặt khác|駐輪場所~ちゅうりんばしょ~chỗ đỗ xe|の~の~của|確保~かくほ~đảm bảo|が~が~trợ từ chủ ngữ|課題~かだい~vấn đề|となっている~となっている~đang trở thành','Tuy tiện lợi, việc đảm bảo chỗ đỗ xe đang là một vấn đề.'],
    ['地域~ちいき~địa phương|の~の~của|事情~じじょう~hoàn cảnh|に応じて~におうじて~phù hợp với|運用方法~うんようほうほう~cách vận hành|を~を~trợ từ tân ngữ|工夫する~くふうする~tìm cách cải tiến|必要~ひつよう~cần thiết|がある~がある~có','Cần cải tiến cách vận hành phù hợp với hoàn cảnh địa phương.'],
  ]],
  ['language-perspectives','Ngôn ngữ mở thêm góc nhìn','言葉と世界の見方','N1','jlpt',['jlpt','podcast'],[
    ['異なる~ことなる~khác nhau|言語~げんご~ngôn ngữ|を~を~trợ từ tân ngữ|学ぶ~まなぶ~học|こと~こと~việc|は~は~trợ từ chủ đề|世界~せかい~thế giới|の~の~của|捉え方~とらえかた~cách nhìn nhận|を~を~trợ từ tân ngữ|問い直す~といなおす~xem xét lại|契機~けいき~cơ hội|となる~となる~trở thành','Học một ngôn ngữ khác là cơ hội xem lại cách ta nhìn thế giới.'],
    ['翻訳~ほんやく~dịch thuật|だけでは~だけでは~chỉ thì|伝えきれない~つたえきれない~không truyền tải hết|微妙な~びみょうな~tinh tế|響き~ひびき~sắc thái|が~が~trợ từ chủ ngữ|言葉~ことば~ngôn từ|には~には~trong|宿っている~やどっている~chứa đựng','Ngôn từ chứa những sắc thái tinh tế mà bản dịch không thể truyền tải hết.'],
    ['その~その~đó|違い~ちがい~khác biệt|に~に~với|気づく~きづく~nhận ra|たび~たび~mỗi lần|他者~たしゃ~người khác|への~への~đối với|理解~りかい~sự thấu hiểu|も~も~cũng|深まる~ふかまる~sâu sắc hơn','Mỗi lần nhận ra khác biệt ấy, ta cũng hiểu người khác sâu sắc hơn.'],
  ]],
  ['changing-town','Thị trấn đang đổi thay','変わりゆく商店街','N1','jlpt',['jlpt','news','history'],[
    ['商店街~しょうてんがい~phố mua sắm|の~の~của|再生~さいせい~hồi sinh|を~を~trợ từ tân ngữ|めぐって~めぐって~xoay quanh|住民~じゅうみん~cư dân|の~の~của|間~あいだ~giữa|で~で~ở|議論~ぎろん~thảo luận|が~が~trợ từ chủ ngữ|続いている~つづいている~đang tiếp tục','Cư dân vẫn đang thảo luận về việc hồi sinh phố mua sắm.'],
    ['新しさ~あたらしさ~sự mới mẻ|を~を~trợ từ tân ngữ|求める~もとめる~tìm kiếm|あまり~あまり~quá mức|土地~とち~vùng đất|の~の~của|記憶~きおく~ký ức|を~を~trợ từ tân ngữ|消してはならない~けしてはならない~không được xóa bỏ','Không được vì quá tìm kiếm cái mới mà xóa đi ký ức của vùng đất.'],
    ['変化~へんか~thay đổi|を~を~trợ từ tân ngữ|受け入れつつも~うけいれつつも~dẫu chấp nhận|守る~まもる~giữ gìn|べき~べき~nên|もの~もの~điều|を~を~trợ từ tân ngữ|見極めたい~みきわめたい~muốn nhận định rõ','Dẫu đón nhận thay đổi, chúng ta vẫn muốn nhận định rõ điều cần giữ gìn.'],
  ]],
];
const durations=audioManifest as Record<string,number>;
export const lessons:Lesson[]=seed.map(([id,title,titleJa,level,category,tags,sentences])=>{
  const parsed=sentences.map(([packed,translation],i):LessonSentence=>{
    const words=packed.split('|').map(part=>{const [text,reading,meaning]=part.split('~');return {text,reading,translation:meaning};});
    const audioKey=`${id}-${i+1}`;
    return {id:audioKey,text:words.map(w=>w.text).join('')+'。',reading:words.map(w=>w.reading).join(''),translation,words,audio:durations[audioKey]?`/lessons/audio/${audioKey}.mp3`:null,duration:durations[audioKey]??Math.max(3,words.map(w=>w.reading).join('').length/5)};
  });
  return {id,title,titleJa,level,category,tags,sentences:parsed,duration:parsed.reduce((sum,s)=>sum+s.duration,0),image:`/lessons/${id}.svg`,plays:0,source:'AUDIO'};
});
