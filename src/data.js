export const exhibits = [
  {id:'reef',name:'Coral Reef',tag:'THE LIVING REEF',range:[18,-23],stop:0,color:'#83dfc5',fact:'Tiny coral animals build limestone skeletons. Together, their colonies create shelter for a remarkable diversity of marine life.',activity:'Restore the reef',instruction:'Select three pale coral colonies behind the left viewing window to restore this demonstration reef.',source:'https://oceanservice.noaa.gov/education/tutorial_corals/coral07_importance.html'},
  {id:'shark',name:'Shark Tunnel',tag:'BENEATH THE BLUE',range:[-23,-49],stop:-35,color:'#79bde3',fact:'Sharks detect weak electrical fields through sensory organs called ampullae of Lorenzini. Different senses help them locate prey.',activity:'Myth or fact',instruction:'Investigate the shark exhibit and decide whether the statement is true.',source:'https://www.fisheries.noaa.gov/feature-story/debunking-common-shark-myths'},
  {id:'tropical',name:'Tropical Ocean',tag:'LIFE IN THE SUNLIGHT',range:[-49,-69],stop:-57,color:'#f2bf78',fact:'Green turtles feed mainly on seagrasses and algae as adults. Coastal habitats provide both food and shelter.',activity:'Habitat match',instruction:'Match the green turtle and butterflyfish to their feeding habitats.',source:'https://www.fisheries.noaa.gov/species/green-turtle'},
  {id:'kelp',name:'Kelp Forest',tag:'A FOREST BENEATH THE WAVES',range:[-69,-87],stop:-77,color:'#b9cf89',fact:'Giant kelp is a large brown alga. Its underwater forests provide food and shelter for fish and many other marine animals.',activity:'Observation stop',instruction:'Watch the kelp sway and photograph a fish for your field journal.',source:'https://www.montereybayaquarium.org/visit/exhibits/kelp-forest'},
  {id:'deep',name:'Deep Sea',tag:'THE LIVING DARK',range:[-87,-103],stop:-94,color:'#bf9ee8',fact:'Bioluminescence is light produced through a chemical reaction by a living organism. It can help attract prey, communicate or defend against predators.',activity:'Research light',instruction:'Switch on your research light, then find and select three jellyfish in the dark tank.',source:'https://oceanexplorer.noaa.gov/ocean-fact/bioluminescence/'},
  {id:'ocean',name:'Grand Ocean Hall',tag:'A WINDOW INTO THE OCEAN',range:[-103,-118],stop:-108,color:'#8acadb',fact:'Whale sharks are filter feeders. These enormous fish feed on plankton and small animals rather than hunting large prey.',activity:'Field quiz',instruction:'Complete the four-question quiz at the end of your visit.',source:'https://www.georgiaaquarium.org/animal/whale-shark/'}
];
export const species = {
  clown:{name:'Clownfish',latin:'Amphiprioninae',fact:'Clownfish live among sea anemones. Their protective mucus helps them coexist with the anemone’s stinging tentacles.'},
  tang:{name:'Blue tang',latin:'Paracanthurus hepatus',fact:'Blue tangs graze on algae and live around coral reefs. Their vivid colors and distinctive outline make them easy to recognize.'},
  butterfly:{name:'Butterflyfish',latin:'Chaetodontidae',fact:'Many butterflyfish feed on coral polyps. Reef structure provides feeding sites and shelter.'},
  shark:{name:'Reef shark',latin:'Carcharhinidae',fact:'Reef sharks patrol reef edges and help shape marine food webs. Observe their side-to-side tail motion.'},
  whale:{name:'Whale shark',latin:'Rhincodon typus',fact:'The whale shark is the largest living fish. Its broad mouth filters small organisms from the water; each animal has a distinctive pattern of spots.'},
  ray:{name:'Manta ray',latin:'Mobulidae',fact:'Manta rays move with broad, wing-like pectoral fins and feed by filtering plankton from the water.'},
  turtle:{name:'Green turtle',latin:'Chelonia mydas',fact:'Green turtles are reptiles that breathe air. Adults feed mainly on seagrasses and algae.'},
  jelly:{name:'Deep-sea jelly',latin:'Stylized observation model',fact:'Some deep-sea jellies produce light. This glowing model illustrates bioluminescence rather than representing a specific species.'},
  silver:{name:'Schooling fish',latin:'Open-water observation',fact:'Swimming together can help fish reduce predation risk. Watch how neighboring fish coordinate their direction.'}
};
export const questions = [
  {q:'What builds the hard structure of a coral reef?',a:['Colonies of coral animals','Layers of seaweed','Fish building nests'],correct:0,why:'Coral polyps build calcium-carbonate skeletons.'},
  {q:'What do whale sharks mainly eat?',a:['Large sharks','Plankton and small animals','Sea turtles'],correct:1,why:'Whale sharks filter small organisms from water.'},
  {q:'Which habitat provides food for adult green turtles?',a:['Seagrass meadows','Dry beaches','Deep-sea vents'],correct:0,why:'Adults feed mainly on seagrasses and algae.'},
  {q:'What is bioluminescence?',a:['Sunlight reflecting from scales','A tank lamp','Light produced by a living organism'],correct:2,why:'A chemical reaction produces the organism’s light.'}
];
