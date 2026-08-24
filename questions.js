const bank = [];

function add(c,l,q,correct,wrongs,h,slot=0){
  const right=String(correct);
  const unique=[...new Set(wrongs.map(String).filter(v=>v!==right))].slice(0,3);
  while(unique.length<3) unique.push(`Choice ${unique.length+1}`);
  const x=((slot%4)+4)%4;
  const a=[...unique]; a.splice(x,0,right);
  bank.push({c,l,q,a,x,h});
}

// MATH — generated combinations make repeat games feel different.
for(let a=2;a<=12;a++) for(let b=1;b<=6;b++){
  const n=a+b; add('math',1,`What is ${a} + ${b}?`,n,[n-1,n+1,n+2],'Add the two numbers together.',a+b);
}
for(let a=6;a<=18;a+=2) for(let b=1;b<=5;b++){
  const n=a-b; add('math',1,`What is ${a} − ${b}?`,n,[n-1,n+1,n+2],'Count backward.',a-b);
}
for(let a=2;a<=12;a++) for(let b=2;b<=12;b++){
  const n=a*b; add('math',2,`What is ${a} × ${b}?`,n,[n-a,n+b,n+a],'Use a multiplication fact you know.',a*b);
}
for(let d=2;d<=12;d++) for(let q=2;q<=8;q++){
  const n=d*q; add('math',2,`What is ${n} ÷ ${d}?`,q,[q-1,q+1,q+2],`${d} times what equals ${n}?`,n+d);
}
[[20,50],[25,80],[10,130],[50,46],[25,120],[20,85],[10,270],[50,74],[25,44],[20,150],[10,360],[25,200]].forEach(([p,n],i)=>{
  const ans=p*n/100; add('math',3,`What is ${p}% of ${n}?`,ans,[ans+5,ans-5,n/p],`${p}% can be turned into a simple fraction or decimal.`,i);
});
[[2,3,12],[3,4,20],[5,6,24],[3,5,30],[4,7,28],[5,8,40],[2,5,35],[3,8,32]].forEach(([num,den,n],i)=>{
  const ans=n*num/den; add('math',3,`What is ${num}/${den} of ${n}?`,ans,[ans+2,ans-2,n/den],`Find 1/${den} first, then multiply by ${num}.`,i);
});
for(let x=2;x<=10;x++) for(let m=2;m<=5;m++){
  const b=(x+m)%6+1, total=m*x+b;
  add('math',4,`Solve: ${m}x + ${b} = ${total}`,x,[x-1,x+1,x+2],`Subtract ${b}, then divide by ${m}.`,x+m);
}
[[15,260],[18,250],[12,350],[35,180],[22,450],[8,625],[30,240],[16,375],[45,160],[32,275]].forEach(([p,n],i)=>{
  const ans=p*n/100; add('math',5,`What is ${p}% of ${n}?`,ans,[ans+10,ans-10,ans+5],`Convert ${p}% to a decimal and multiply.`,i);
});
[
 ['A $60 item is 20% off. What is the sale price?','48',['12','40','52'],'Find the $12 discount, then subtract it.'],
 ['A recipe needs 3/4 cup. You make half a batch. How much is needed?','3/8 cup',['1/4 cup','1/2 cup','6/8 cup'],'Multiply 3/4 by 1/2.'],
 ['A car travels 180 miles in 3 hours. Average speed?','60 mph',['45 mph','90 mph','540 mph'],'Distance divided by time.'],
 ['What is 2³ × 2²?','32',['16','64','8'],'Add exponents when multiplying the same base.'],
 ['If 5 notebooks cost $17.50, what is one notebook?','$3.50',['$2.50','$3.00','$4.50'],'Divide total cost by 5.']
].forEach((v,i)=>add('math',5,v[0],v[1],v[2],v[3],i));

// WORDS
[
 [1,'Which word rhymes with CAT?','Hat',['Dog','Sun','Cup'],'Listen to the ending sound.'],
 [1,'Which word rhymes with LIGHT?','Night',['Leaf','Boat','Rain'],'Match the ending sound.'],
 [1,'Which word begins with the same sound as BALL?','Bike',['Cat','Fish','Sun'],'Listen to the first sound.'],
 [1,'Which word is a color?','Purple',['Table','Jump','Spoon'],'Think of something you can see in a rainbow.'],
 [1,'Which word names an animal?','Rabbit',['Window','Happy','Run'],'An animal is a living creature.'],
 [2,'What is the opposite of ANCIENT?','Modern',['Old','Dusty','Broken'],'Ancient means very old.'],
 [2,'What is the opposite of EMPTY?','Full',['Open','Small','Quiet'],'Think of a filled cup.'],
 [2,'Which word means almost the same as HAPPY?','Glad',['Angry','Tired','Cold'],'A synonym has a similar meaning.'],
 [2,'Which word means almost the same as QUICK?','Fast',['Late','Heavy','Slow'],'Think speed.'],
 [2,'Which spelling is correct?','Because',['Becuz','Beacause','Becaus'],'Say the word slowly and look for the familiar spelling.'],
 [2,'Which word is a noun?','Teacher',['Quickly','Blue','Running'],'A noun names a person, place, thing, or idea.'],
 [3,'Which sentence uses “their” correctly?','Their dog is friendly.',['Their going home.','Put it over their.','They left they’re shoes.'],'“Their” shows ownership.'],
 [3,'Choose the correct word: “___ going to the park.”','They’re',['Their','There','Theirs'],'They’re means “they are.”'],
 [3,'Which word is an adverb?','Quickly',['Quick','Runner','Bright'],'Adverbs often describe how something happens.'],
 [3,'What does “reluctant” mean?','Unwilling or hesitant',['Very excited','Extremely loud','Easy to see'],'Someone reluctant does not really want to do it.'],
 [3,'Which word is a homophone of “sea”?','See',['Say','Sue','Saw'],'Homophones sound alike.'],
 [4,'What does “meticulous” most nearly mean?','Very careful',['Careless','Loud','Uncertain'],'A meticulous person notices tiny details.'],
 [4,'What does “benevolent” mean?','Kind and generous',['Cruel','Confused','Invisible'],'Think of someone doing good for others.'],
 [4,'What does “ambiguous” mean?','Open to more than one meaning',['Perfectly clear','Very ancient','Extremely loud'],'An ambiguous statement can be understood in different ways.'],
 [4,'Which sentence contains a metaphor?','The classroom was a zoo.',['The classroom was like a zoo.','The classroom had desks.','Students entered the classroom.'],'A metaphor says one thing is another.'],
 [4,'Which sentence uses a semicolon correctly?','I was tired; I kept working.',['I was; tired and working.','I; was tired.','I was tired; and.'],'A semicolon can join closely related independent clauses.'],
 [5,'Which is an example of irony?','A fire station burns down.',['A dog barks.','Rain falls in spring.','A clock tells time.'],'Look for an unexpected contrast.'],
 [5,'What does “ubiquitous” mean?','Found everywhere',['Very rare','Dangerous','Unfinished'],'Think of something present almost everywhere.'],
 [5,'What does “pragmatic” most nearly mean?','Practical',['Dreamy','Ancient','Secretive'],'A pragmatic approach focuses on what works.'],
 [5,'What is an oxymoron?','Two contradictory terms used together',['A repeated vowel sound','A question with no answer','An exaggerated comparison'],'Examples include “deafening silence.”'],
 [5,'Which word best means “to make less severe”?','Mitigate',['Aggravate','Imitate','Calculate'],'To mitigate is to reduce harm or severity.']
].forEach((v,i)=>add('words',v[0],v[1],v[2],v[3],v[4],i));

// SCIENCE
[
 [1,'Which animal is a mammal?','Dolphin',['Frog','Shark','Lizard'],'Mammals breathe air and nurse their young.'],
 [1,'Which body part helps you smell?','Nose',['Knee','Elbow','Toe'],'It is on your face.'],
 [1,'What do plants need from the Sun?','Light',['Sand','Plastic','Metal'],'Plants use sunlight to make food.'],
 [1,'Which object would a magnet most likely attract?','Iron nail',['Wooden spoon','Rubber ball','Paper cup'],'Magnets attract certain metals.'],
 [1,'Water freezes into what?','Ice',['Steam','Sand','Smoke'],'Freezing turns liquid water solid.'],
 [2,'Plants make food using sunlight in a process called…','Photosynthesis',['Respiration','Evaporation','Erosion'],'“Photo” relates to light.'],
 [2,'Which planet is known as the Red Planet?','Mars',['Venus','Jupiter','Neptune'],'Its surface contains iron oxides.'],
 [2,'What gas do humans need to breathe?','Oxygen',['Helium','Neon','Hydrogen'],'Your lungs move this gas into the blood.'],
 [2,'Which state of matter has a fixed shape?','Solid',['Liquid','Gas','Plasma'],'A solid keeps its shape.'],
 [2,'Which organ pumps blood around the body?','Heart',['Lung','Stomach','Kidney'],'It beats continuously.'],
 [3,'What is the chemical symbol for oxygen?','O',['Ox','Og','Oy'],'It is one letter.'],
 [3,'What is the largest organ of the human body?','Skin',['Heart','Liver','Brain'],'It covers your whole body.'],
 [3,'Which blood cells help fight infection?','White blood cells',['Red blood cells','Platelets','Plasma only'],'They are part of the immune system.'],
 [3,'What is the center of an atom called?','Nucleus',['Orbit','Cell wall','Molecule'],'Protons and neutrons are found there.'],
 [3,'Which process changes liquid water into water vapor?','Evaporation',['Freezing','Condensation','Melting'],'Heat helps liquid molecules escape into gas.'],
 [4,'Which force keeps planets in orbit around the Sun?','Gravity',['Magnetism','Friction','Buoyancy'],'Masses attract one another.'],
 [4,'What is the pH of a neutral solution at room temperature?','7',['0','3','14'],'Neutral is in the middle of the common pH scale.'],
 [4,'Which type of wave can travel through a vacuum?','Electromagnetic wave',['Sound wave','Water wave','Seismic S-wave'],'Light can cross empty space.'],
 [4,'What does DNA primarily store?','Genetic information',['Body heat','Oxygen','Electric charge'],'DNA contains biological instructions.'],
 [4,'Which law says every action has an equal and opposite reaction?','Newton’s third law',['Newton’s first law','Ohm’s law','Boyle’s law'],'Think action and reaction.'],
 [5,'Which organelle is the main site of ATP production?','Mitochondrion',['Nucleus','Ribosome','Golgi apparatus'],'Often called the powerhouse of the cell.'],
 [5,'What particle carries a negative electric charge?','Electron',['Proton','Neutron','Photon'],'Electrons occupy regions around the nucleus.'],
 [5,'Which element has atomic number 6?','Carbon',['Oxygen','Hydrogen','Nitrogen'],'Atomic number equals the number of protons.'],
 [5,'What is the approximate speed of light in a vacuum?','300,000 km/s',['30,000 km/s','3,000 km/s','3,000,000 km/s'],'It is about 3 × 10^5 kilometers per second.'],
 [5,'Which molecule is the main energy currency of cells?','ATP',['DNA','RNA','CO₂'],'Cells use it to transfer usable energy.']
].forEach((v,i)=>add('science',v[0],v[1],v[2],v[3],v[4],i));

// WORLD / GEOGRAPHY
[
 [1,'Which is the largest ocean?','Pacific',['Atlantic','Indian','Arctic'],'It lies between Asia and the Americas.'],
 [1,'Which continent is the United States in?','North America',['Europe','Africa','Asia'],'Canada and Mexico are on the same continent.'],
 [1,'Which direction is opposite north?','South',['East','West','Up'],'Look at a compass.'],
 [1,'Which is a continent?','Africa',['Texas','Paris','Pacific Ocean'],'Continents are enormous land regions.'],
 [2,'Which continent contains Egypt?','Africa',['Asia','Europe','South America'],'Think Nile River.'],
 [2,'Which country is directly north of the United States?','Canada',['Mexico','Brazil','Japan'],'It shares a very long border with the U.S.'],
 [2,'What is the capital of France?','Paris',['Rome','Madrid','Berlin'],'The Eiffel Tower is there.'],
 [2,'What is the capital of Italy?','Rome',['Milan','Venice','Naples'],'It was the center of the Roman Empire.'],
 [2,'Which desert covers much of northern Africa?','Sahara',['Gobi','Mojave','Atacama'],'It is the world’s largest hot desert.'],
 [3,'What is the capital of Japan?','Tokyo',['Kyoto','Seoul','Osaka'],'It is one of the world’s largest cities.'],
 [3,'What is the capital of Australia?','Canberra',['Sydney','Melbourne','Perth'],'It is not Australia’s largest city.'],
 [3,'Which river flows through Egypt?','Nile',['Amazon','Danube','Mississippi'],'Ancient Egyptian civilization grew along it.'],
 [3,'Mount Everest lies in the Himalayas on the border of Nepal and…','China',['India','Pakistan','Bhutan'],'Tibet is on the other side of the border.'],
 [3,'Which country has the shape often compared to a boot?','Italy',['Spain','Greece','Portugal'],'Look at a map of southern Europe.'],
 [4,'The Prime Meridian passes through which location?','Greenwich',['Rome','Cairo','Sydney'],'Longitude 0°.'],
 [4,'Which strait separates Spain from Morocco?','Strait of Gibraltar',['Bering Strait','Bosporus','Strait of Hormuz'],'It connects the Atlantic and Mediterranean.'],
 [4,'Which mountain range forms a major boundary between France and Spain?','Pyrenees',['Alps','Andes','Rockies'],'They run along the countries’ border.'],
 [4,'Which sea lies between Europe and Africa?','Mediterranean Sea',['Baltic Sea','Bering Sea','Coral Sea'],'Italy, Greece, Egypt, and Morocco border it.'],
 [4,'Which country contains the city of Istanbul?','Türkiye',['Greece','Egypt','Romania'],'The city spans Europe and Asia.'],
 [5,'Which country is completely surrounded by South Africa?','Lesotho',['Botswana','Namibia','Eswatini'],'It is a mountainous kingdom.'],
 [5,'Which river flows through Budapest?','Danube',['Rhine','Seine','Thames'],'It crosses several European capitals.'],
 [5,'Which country has the most natural lakes?','Canada',['Brazil','China','Australia'],'Its glaciated landscape contains enormous numbers of lakes.'],
 [5,'The Atacama Desert is primarily in which country?','Chile',['Peru','Argentina','Bolivia'],'It stretches along the Pacific side of South America.'],
 [5,'Which African lake is the world’s largest tropical lake by area?','Lake Victoria',['Lake Tanganyika','Lake Malawi','Lake Chad'],'It is shared by Uganda, Kenya, and Tanzania.']
].forEach((v,i)=>add('world',v[0],v[1],v[2],v[3],v[4],i));

// HISTORY
[
 [1,'Who was the first U.S. president?','George Washington',['Abraham Lincoln','Thomas Jefferson','John Adams'],'His portrait is on the one-dollar bill.'],
 [1,'The pyramids of Giza were built in ancient…','Egypt',['Rome','Greece','China'],'They stand near the Nile.'],
 [1,'Who is famous for the “I Have a Dream” speech?','Martin Luther King Jr.',['George Washington','Thomas Edison','Amelia Earhart'],'He was a major civil-rights leader.'],
 [2,'The U.S. Declaration of Independence was adopted in…','1776',['1492','1865','1914'],'Think July 4.'],
 [2,'Which civilization built Machu Picchu?','Inca',['Roman','Viking','Maya'],'It is high in the Andes of Peru.'],
 [2,'Who wrote the Declaration of Independence’s first draft?','Thomas Jefferson',['George Washington','Benjamin Franklin','James Madison'],'He later became the third U.S. president.'],
 [2,'The Renaissance began in which country?','Italy',['Canada','Japan','Brazil'],'Cities such as Florence played a major role.'],
 [3,'Who was U.S. president during most of the Civil War?','Abraham Lincoln',['Andrew Jackson','Theodore Roosevelt','Ulysses S. Grant'],'He issued the Emancipation Proclamation.'],
 [3,'World War II ended in which year?','1945',['1918','1939','1955'],'Germany surrendered in May and Japan in September.'],
 [3,'Who was the first person to walk on the Moon?','Neil Armstrong',['Buzz Aldrin','Yuri Gagarin','John Glenn'],'Apollo 11 landed in 1969.'],
 [3,'Which ancient civilization created democracy in Athens?','Greek',['Roman','Egyptian','Persian'],'Athens was a Greek city-state.'],
 [3,'The printing press in Europe is closely associated with…','Johannes Gutenberg',['Isaac Newton','Galileo Galilei','Leonardo da Vinci'],'His movable-type press transformed book production.'],
 [4,'The Magna Carta was first issued in which country?','England',['France','Spain','Italy'],'King John agreed to it in 1215.'],
 [4,'Which empire used Constantinople as its capital?','Byzantine',['Aztec','Mughal','Inca'],'It was the eastern continuation of the Roman Empire.'],
 [4,'The Protestant Reformation is strongly associated with…','Martin Luther',['Charlemagne','Socrates','Marco Polo'],'He published the Ninety-five Theses.'],
 [4,'Which treaty formally ended World War I between Germany and the Allied powers?','Treaty of Versailles',['Treaty of Paris 1783','Treaty of Tordesillas','Treaty of Ghent'],'It was signed in 1919.'],
 [4,'Which empire was ruled by Mansa Musa?','Mali Empire',['Ottoman Empire','Roman Empire','Aztec Empire'],'He became famous for his wealth and pilgrimage to Mecca.'],
 [5,'The Peace of Westphalia ended which major European conflict?','Thirty Years’ War',['Hundred Years’ War','Crimean War','Seven Years’ War'],'The agreements were signed in 1648.'],
 [5,'Which dynasty built much of the present Great Wall of China?','Ming',['Qin','Han','Tang'],'Many surviving sections date from this dynasty.'],
 [5,'The Meiji Restoration began in which country?','Japan',['China','Korea','Thailand'],'It began in 1868 and accelerated modernization.'],
 [5,'Which city was buried by Mount Vesuvius in AD 79?','Pompeii',['Sparta','Carthage','Alexandria'],'Ash preserved much of the Roman city.'],
 [5,'Which document begins with “We the People”?','U.S. Constitution',['Declaration of Independence','Magna Carta','Gettysburg Address'],'Those are the Constitution’s opening words.']
].forEach((v,i)=>add('history',v[0],v[1],v[2],v[3],v[4],i));

// BIBLE — Protestant-oriented wording where book counts differ by tradition.
[
 [1,'Who built the ark?','Noah',['Moses','David','Peter'],'Genesis tells his story.'],
 [1,'Who defeated Goliath?','David',['Samson','Solomon','Joshua'],'He used a sling.'],
 [1,'Who was swallowed by a great fish?','Jonah',['Joseph','Elijah','Paul'],'His story is in the book named for him.'],
 [1,'Who led the Israelites out of Egypt?','Moses',['Noah','Samuel','Peter'],'Think Exodus.'],
 [1,'Where was Jesus born?','Bethlehem',['Nazareth','Jerusalem','Rome'],'The nativity story names this town.'],
 [2,'Who was known for great strength?','Samson',['Solomon','Isaiah','Luke'],'His hair is part of his story.'],
 [2,'Who interpreted Pharaoh’s dreams in Egypt?','Joseph',['Aaron','Joshua','Saul'],'He rose from prisoner to a powerful position.'],
 [2,'Who was the mother of Jesus?','Mary',['Martha','Ruth','Esther'],'She appears in the Gospel birth narratives.'],
 [2,'Which disciple walked on water toward Jesus?','Peter',['John','Thomas','Matthew'],'He stepped out of the boat.'],
 [2,'What was the first book of the Bible?','Genesis',['Exodus','Psalms','Matthew'],'Its name relates to beginnings.'],
 [3,'How many books are in the Protestant Bible?','66',['39','72','80'],'39 Old Testament + 27 New Testament.'],
 [3,'Who became king after David?','Solomon',['Samuel','Saul','Hezekiah'],'He was known for wisdom.'],
 [3,'On what road did Saul encounter the risen Jesus?','Road to Damascus',['Road to Jericho','Appian Way','Road to Emmaus'],'This encounter changed his life.'],
 [3,'Which Gospel was written by a physician according to traditional attribution?','Luke',['Matthew','Mark','John'],'Colossians calls Luke the beloved physician.'],
 [3,'Who climbed a sycamore tree to see Jesus?','Zacchaeus',['Nicodemus','Bartimaeus','Lazarus'],'He was a tax collector.'],
 [4,'Which Gospel begins with “In the beginning was the Word”?','John',['Matthew','Mark','Luke'],'It emphasizes the Word becoming flesh.'],
 [4,'Which New Testament letter contains the “armor of God” passage?','Ephesians',['Romans','Hebrews','James'],'Chapter 6.'],
 [4,'Who said, “Here am I; send me”?','Isaiah',['Jeremiah','Ezekiel','Daniel'],'It appears in Isaiah 6.'],
 [4,'Which judge asked God for signs involving a fleece?','Gideon',['Deborah','Samson','Jephthah'],'Judges 6 tells the story.'],
 [4,'Who replaced Judas among the Twelve in Acts?','Matthias',['Barnabas','Silas','Timothy'],'Acts 1 records the selection.'],
 [5,'Which prophet confronted King David after his sin involving Bathsheba?','Nathan',['Elijah','Isaiah','Amos'],'He told David a parable about a poor man’s lamb.'],
 [5,'Which New Testament book describes Jesus as a high priest after the order of Melchizedek?','Hebrews',['Romans','Galatians','Revelation'],'The priesthood theme is central to this book.'],
 [5,'In which city were Jesus’ followers first called Christians?','Antioch',['Jerusalem','Corinth','Ephesus'],'Acts 11:26.'],
 [5,'Which Old Testament book contains the line “For everything there is a season”?','Ecclesiastes',['Proverbs','Job','Isaiah'],'It appears near the start of chapter 3.'],
 [5,'Which apostle wrote about the “fruit of the Spirit” in Galatians?','Paul',['Peter','John','James'],'Galatians 5 lists the fruit.']
].forEach((v,i)=>add('bible',v[0],v[1],v[2],v[3],v[4],i));

export const QUESTIONS = bank;
