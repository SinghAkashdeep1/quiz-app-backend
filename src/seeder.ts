import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import Category from './models/Category';
import Question from './models/Question';
import User from './models/User';
import Icon from './models/Icon';
import connectDB from './config/db';

dotenv.config();

const categoryTemplates = [
  { name: 'Kids', icon: 'child_care', color: '#FF9800', guestCreditLimit: 2, rewards: { easy: 10, medium: 25, hard: 60 } },
  { name: 'Movies', icon: 'movie', color: '#E91E63', guestCreditLimit: 3, rewards: { easy: 15, medium: 35, hard: 80 } },
  { name: 'General Knowledge', icon: 'public', color: '#2196F3', guestCreditLimit: 5, rewards: { easy: 20, medium: 50, hard: 100 } },
  { name: 'Current Affairs', icon: 'event', color: '#4CAF50', guestCreditLimit: 0, rewards: { easy: 50, medium: 100, hard: 250 } },
  { name: 'Sports', icon: 'fitness_center', color: '#00BCD4', guestCreditLimit: 3, rewards: { easy: 15, medium: 40, hard: 120 } },
  { name: 'Science', icon: 'science', color: '#673AB7', guestCreditLimit: 4, rewards: { easy: 20, medium: 45, hard: 110 } },
  { name: 'History', icon: 'history', color: '#795548', guestCreditLimit: 3, rewards: { easy: 15, medium: 40, hard: 90 } },
  { name: 'Geography', icon: 'explore', color: '#3F51B5', guestCreditLimit: 4, rewards: { easy: 15, medium: 35, hard: 85 } },
  { name: 'Music', icon: 'music_note', color: '#F44336', guestCreditLimit: 5, rewards: { easy: 10, medium: 30, hard: 75 } },
  { name: 'Art', icon: 'brush', color: '#9C27B0', guestCreditLimit: 3, rewards: { easy: 15, medium: 40, hard: 100 } },
  { name: 'Technology', icon: 'computer', color: '#607D8B', guestCreditLimit: 2, rewards: { easy: 25, medium: 60, hard: 150 } },
  { name: 'Literature', icon: 'menu_book', color: '#8BC34A', guestCreditLimit: 4, rewards: { easy: 20, medium: 45, hard: 95 } },
  { name: 'Food & Drink', icon: 'restaurant', color: '#FF5722', guestCreditLimit: 5, rewards: { easy: 10, medium: 25, hard: 70 } },
  { name: 'Animals', icon: 'pets', color: '#009688', guestCreditLimit: 4, rewards: { easy: 10, medium: 30, hard: 65 } },
  { name: 'Space', icon: 'auto_awesome', color: '#263238', guestCreditLimit: 3, rewards: { easy: 30, medium: 75, hard: 200 } }
];

const icons = [
  { name: 'child_care', label: 'Child Care' },
  { name: 'movie', label: 'Movie' },
  { name: 'public', label: 'Public' },
  { name: 'event', label: 'Event' },
  { name: 'school', label: 'School' },
  { name: 'science', label: 'Science' },
  { name: 'history', label: 'History' },
  { name: 'fitness_center', label: 'Sports' },
  { name: 'pets', label: 'Pets' },
  { name: 'explore', label: 'Explore' },
  { name: 'psychology', label: 'Brain' },
  { name: 'menu_book', label: 'Book' },
  { name: 'computer', label: 'Computer' },
  { name: 'music_note', label: 'Music' },
  { name: 'brush', label: 'Art' },
  { name: 'videogame_asset', label: 'Gaming' },
  { name: 'restaurant', label: 'Food' },
  { name: 'auto_awesome', label: 'Space' }
];

const realQuestions: Record<string, any[]> = {
  'Kids': [
    { text: 'Which animal is known as the King of the Jungle?', options: ['Elephant', 'Lion', 'Tiger', 'Giraffe'], correctAnswerIndex: 1, difficulty: 'easy' },
    { text: 'How many colors are there in a rainbow?', options: ['5', '6', '7', '8'], correctAnswerIndex: 2, difficulty: 'easy' },
    { text: 'What is the color of an emerald?', options: ['Red', 'Blue', 'Green', 'Yellow'], correctAnswerIndex: 2, difficulty: 'easy' },
    { text: 'Which planet is known as the Red Planet?', options: ['Earth', 'Mars', 'Jupiter', 'Venus'], correctAnswerIndex: 1, difficulty: 'easy' },
    { text: 'How many legs does a spider have?', options: ['4', '6', '8', '10'], correctAnswerIndex: 2, difficulty: 'easy' },
    { text: 'What do bees make?', options: ['Milk', 'Honey', 'Juice', 'Water'], correctAnswerIndex: 1, difficulty: 'easy' },
    { text: 'Which is the largest bird in the world?', options: ['Eagle', 'Peacock', 'Ostrich', 'Penguin'], correctAnswerIndex: 2, difficulty: 'medium' },
    { text: 'What is the name of the fairy in Peter Pan?', options: ['Cinderella', 'Tinker Bell', 'Snow White', 'Belle'], correctAnswerIndex: 1, difficulty: 'medium' },
    { text: 'How many days are there in a leap year?', options: ['364', '365', '366', '367'], correctAnswerIndex: 2, difficulty: 'medium' },
    { text: 'What is the boiling point of water?', options: ['50°C', '90°C', '100°C', '120°C'], correctAnswerIndex: 2, difficulty: 'hard' },
    { text: 'What is the color of a school bus?', options: ['Red', 'Yellow', 'Blue', 'Green'], correctAnswerIndex: 1, difficulty: 'easy', isAlternative: true },
    { text: 'Which fruit is red and has seeds on the outside?', options: ['Apple', 'Banana', 'Strawberry', 'Grape'], correctAnswerIndex: 2, difficulty: 'easy', isAlternative: true }
  ],
  'Movies': [
    { text: 'Who played Jack in the movie Titanic?', options: ['Brad Pitt', 'Leonardo DiCaprio', 'Tom Cruise', 'Johnny Depp'], correctAnswerIndex: 1, difficulty: 'easy' },
    { text: 'Which movie features a character named Simba?', options: ['Toy Story', 'The Lion King', 'Finding Nemo', 'Aladdin'], correctAnswerIndex: 1, difficulty: 'easy' },
    { text: 'What is the highest-grossing film of all time (unadjusted for inflation)?', options: ['Titanic', 'Avatar', 'Avengers: Endgame', 'Star Wars: The Force Awakens'], correctAnswerIndex: 1, difficulty: 'medium' },
    { text: 'Which actor played Iron Man in the Marvel Cinematic Universe?', options: ['Chris Evans', 'Robert Downey Jr.', 'Chris Hemsworth', 'Mark Ruffalo'], correctAnswerIndex: 1, difficulty: 'easy' },
    { text: 'In "The Wizard of Oz", what is the name of Dorothy\'s dog?', options: ['Toto', 'Rex', 'Buddy', 'Max'], correctAnswerIndex: 0, difficulty: 'easy' },
    { text: 'Who directed the movie "Jurassic Park"?', options: ['James Cameron', 'Steven Spielberg', 'Christopher Nolan', 'George Lucas'], correctAnswerIndex: 1, difficulty: 'medium' },
    { text: 'Which movie won the first Academy Award for Best Animated Feature?', options: ['Shrek', 'Monsters, Inc.', 'Finding Nemo', 'Spirited Away'], correctAnswerIndex: 0, difficulty: 'medium' },
    { text: 'What was the first feature-length animated movie ever released?', options: ['Pinocchio', 'Fantasia', 'Snow White and the Seven Dwarfs', 'Dumbo'], correctAnswerIndex: 2, difficulty: 'hard' },
    { text: 'Who is the only actor to win three Academy Awards for Best Actor?', options: ['Jack Nicholson', 'Tom Hanks', 'Daniel Day-Lewis', 'Marlon Brando'], correctAnswerIndex: 2, difficulty: 'hard' },
    { text: 'In which year was the first Harry Potter movie released?', options: ['1999', '2000', '2001', '2002'], correctAnswerIndex: 2, difficulty: 'medium' },
    { text: 'In "Shrek", what color is the ogre?', options: ['Pink', 'Green', 'Blue', 'Purple'], correctAnswerIndex: 1, difficulty: 'easy', isAlternative: true },
    { text: 'Which superhero is known as the "Dark Knight"?', options: ['Superman', 'Spider-Man', 'Batman', 'Iron Man'], correctAnswerIndex: 2, difficulty: 'easy', isAlternative: true }
  ],
  'General Knowledge': [
    { text: 'Which is the largest ocean on Earth?', options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'], correctAnswerIndex: 3, difficulty: 'easy' },
    { text: 'Who painted the Mona Lisa?', options: ['Picasso', 'Van Gogh', 'Da Vinci', 'Michelangelo'], correctAnswerIndex: 2, difficulty: 'easy' },
    { text: 'What is the capital city of France?', options: ['London', 'Berlin', 'Paris', 'Madrid'], correctAnswerIndex: 2, difficulty: 'easy' },
    { text: 'How many continents are there?', options: ['5', '6', '7', '8'], correctAnswerIndex: 2, difficulty: 'easy' },
    { text: 'Which is the smallest country in the world?', options: ['Monaco', 'Vatican City', 'Nauru', 'Tuvalu'], correctAnswerIndex: 1, difficulty: 'medium' },
    { text: 'What is the currency of Japan?', options: ['Won', 'Yuan', 'Yen', 'Ringgit'], correctAnswerIndex: 2, difficulty: 'easy' },
    { text: 'Which language is most spoken in the world (as a first language)?', options: ['English', 'Spanish', 'Mandarin Chinese', 'Hindi'], correctAnswerIndex: 2, difficulty: 'medium' },
    { text: 'Who is the author of "1984"?', options: ['Aldous Huxley', 'George Orwell', 'Ray Bradbury', 'Ernest Hemingway'], correctAnswerIndex: 1, difficulty: 'hard' },
    { text: 'How many bones are there in an adult human body?', options: ['186', '206', '216', '226'], correctAnswerIndex: 1, difficulty: 'medium' },
    { text: 'How many bones are there in an adult human body?', options: ['186', '206', '216', '226'], correctAnswerIndex: 1, difficulty: 'medium' },
    { text: 'What is the hardest natural substance on Earth?', options: ['Gold', 'Iron', 'Diamond', 'Platinum'], correctAnswerIndex: 2, difficulty: 'easy' },
    // Matching Type
    { 
      text: "Match the Country with its Capital", 
      type: "matching", 
      matchingPairs: [
        { left: "India", right: "New Delhi" },
        { left: "Japan", right: "Tokyo" },
        { left: "France", right: "Paris" },
        { left: "Germany", right: "Berlin" }
      ],
      difficulty: "easy" 
    },
    // Multiple Correct
    {
      text: "Which of the following are prime numbers?",
      type: "multiple_correct",
      options: ["2", "3", "4", "5"],
      correctAnswerIndices: [0, 1, 3],
      difficulty: "medium"
    },
    // Fill-in-the-Blank
    {
      text: "Water boils at ___ °C.",
      options: ["90", "100", "110", "120"],
      correctAnswerIndex: 1,
      difficulty: "easy"
    },
    // Multiple Fill-in-the-Blank
    {
      text: "The Sun rises in the ___ and sets in the ___.",
      options: ["North, South", "East, West", "West, East", "South, North"],
      correctAnswerIndex: 1,
      difficulty: "medium"
    },
    // Boolean
    {
      text: "The Earth is the third planet from the Sun.",
      type: "boolean",
      options: ["True", "False"],
      correctAnswerIndex: 0,
      difficulty: "easy"
    },
    { text: 'What is the national animal of India?', options: ['Lion', 'Tiger', 'Elephant', 'Peacock'], correctAnswerIndex: 1, difficulty: 'easy', isAlternative: true },
    { text: 'Which is the largest planet in our solar system?', options: ['Earth', 'Mars', 'Jupiter', 'Saturn'], correctAnswerIndex: 2, difficulty: 'easy', isAlternative: true }
  ],
  'Current Affairs': [
    { text: 'Who is the current President of the United States (as of 2024)?', options: ['Donald Trump', 'Joe Biden', 'Barack Obama', 'Kamala Harris'], correctAnswerIndex: 1, difficulty: 'easy' },
    { text: 'Which country hosted the 2022 FIFA World Cup?', options: ['Russia', 'Brazil', 'Qatar', 'France'], correctAnswerIndex: 2, difficulty: 'easy' },
    { text: 'What is the name of the AI chatbot developed by OpenAI?', options: ['Bard', 'ChatGPT', 'Claude', 'Gemini'], correctAnswerIndex: 1, difficulty: 'easy' },
    { text: 'Who won the ICC Men\'s T20 World Cup 2024?', options: ['South Africa', 'Australia', 'India', 'England'], correctAnswerIndex: 2, difficulty: 'medium' },
    { text: 'Which city hosted the 2024 Summer Olympics?', options: ['Tokyo', 'Paris', 'Los Angeles', 'Brisbane'], correctAnswerIndex: 1, difficulty: 'easy' },
    { text: 'Who is the current CEO of Tesla?', options: ['Jeff Bezos', 'Elon Musk', 'Bill Gates', 'Mark Zuckerberg'], correctAnswerIndex: 1, difficulty: 'easy' },
    { text: 'What is the capital of Ukraine?', options: ['Moscow', 'Warsaw', 'Kyiv', 'Prague'], correctAnswerIndex: 2, difficulty: 'easy' },
    { text: 'Which Indian state is known as "God\'s Own Country"?', options: ['Goa', 'Kerala', 'Himachal Pradesh', 'Sikkim'], correctAnswerIndex: 1, difficulty: 'easy' },
    { text: 'Who is the current Prime Minister of the United Kingdom (as of late 2024)?', options: ['Boris Johnson', 'Rishi Sunak', 'Keir Starmer', 'Liz Truss'], correctAnswerIndex: 2, difficulty: 'medium' },
    { text: 'Which mission was India\'s successful soft landing on the Moon\'s south pole?', options: ['Chandrayaan-1', 'Chandrayaan-2', 'Chandrayaan-3', 'Mangalyaan'], correctAnswerIndex: 2, difficulty: 'medium' }
  ],
  'Sports': [
    { text: 'How many players are there in a football (soccer) team on the field?', options: ['9', '10', '11', '12'], correctAnswerIndex: 2, difficulty: 'easy' },
    { text: 'Who has won the most Ballon d\'Or awards?', options: ['Cristiano Ronaldo', 'Lionel Messi', 'Pele', 'Diego Maradona'], correctAnswerIndex: 1, difficulty: 'easy' },
    { text: 'In which sport would you use a "shuttlecock"?', options: ['Tennis', 'Badminton', 'Table Tennis', 'Squash'], correctAnswerIndex: 1, difficulty: 'easy' },
    { text: 'What is the length of a marathon?', options: ['21.1 km', '42.195 km', '10 km', '50 km'], correctAnswerIndex: 1, difficulty: 'medium' },
    { text: 'Which country has won the most FIFA World Cups?', options: ['Germany', 'Italy', 'Brazil', 'Argentina'], correctAnswerIndex: 2, difficulty: 'easy' },
    { text: 'Who is known as the "Flying Sikh" of India?', options: ['Milkha Singh', 'P.T. Usha', 'Abhinav Bindra', 'Neeraj Chopra'], correctAnswerIndex: 0, difficulty: 'easy' },
    { text: 'In cricket, how many balls are there in one over?', options: ['4', '5', '6', '8'], correctAnswerIndex: 2, difficulty: 'easy' },
    { text: 'Which Grand Slam tennis tournament is played on grass?', options: ['French Open', 'US Open', 'Australian Open', 'Wimbledon'], correctAnswerIndex: 3, difficulty: 'medium' },
    { text: 'What is the maximum break possible in a game of snooker?', options: ['147', '155', '140', '160'], correctAnswerIndex: 0, difficulty: 'hard' },
    { text: 'Which city hosted the first modern Olympic Games in 1896?', options: ['Paris', 'London', 'Athens', 'Rome'], correctAnswerIndex: 2, difficulty: 'hard' }
  ],
  'Science': [
    { text: 'What is the chemical symbol for water?', options: ['CO2', 'H2O', 'NaCl', 'O2'], correctAnswerIndex: 1, difficulty: 'easy' },
    { text: 'Which gas do plants absorb from the atmosphere?', options: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Hydrogen'], correctAnswerIndex: 2, difficulty: 'easy' },
    { text: 'What is the closest planet to the Sun?', options: ['Venus', 'Mars', 'Mercury', 'Earth'], correctAnswerIndex: 2, difficulty: 'easy' },
    { text: 'What is the power house of the cell?', options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Vacuole'], correctAnswerIndex: 1, difficulty: 'medium' },
    { text: 'What is the speed of light?', options: ['300,000 km/s', '150,000 km/s', '1,000,000 km/s', '500,000 km/s'], correctAnswerIndex: 0, difficulty: 'medium' },
    { text: 'Who proposed the theory of relativity?', options: ['Isaac Newton', 'Albert Einstein', 'Galileo Galilei', 'Nikola Tesla'], correctAnswerIndex: 1, difficulty: 'easy' },
    { text: 'What is the atomic number of Hydrogen?', options: ['1', '2', '8', '12'], correctAnswerIndex: 0, difficulty: 'medium' },
    { text: 'Which planet has the most moons?', options: ['Jupiter', 'Saturn', 'Uranus', 'Neptune'], correctAnswerIndex: 1, difficulty: 'hard' },
    { text: 'What is the most abundant gas in Earth\'s atmosphere?', options: ['Oxygen', 'Carbon Dioxide', 'Nitrogen', 'Argon'], correctAnswerIndex: 2, difficulty: 'medium' },
    { text: 'What is the unit of electrical resistance?', options: ['Volt', 'Ampere', 'Ohm', 'Watt'], correctAnswerIndex: 2, difficulty: 'medium' }
  ],
  'History': [
    { text: 'Who was the first President of India?', options: ['Jawaharlal Nehru', 'Dr. Rajendra Prasad', 'Mahatma Gandhi', 'Sardar Patel'], correctAnswerIndex: 1, difficulty: 'easy' },
    { text: 'In which year did World War II end?', options: ['1943', '1944', '1945', '1946'], correctAnswerIndex: 2, difficulty: 'easy' },
    { text: 'Who was the first person to walk on the moon?', options: ['Buzz Aldrin', 'Neil Armstrong', 'Yuri Gagarin', 'Michael Collins'], correctAnswerIndex: 1, difficulty: 'easy' },
    { text: 'Which empire built the Colosseum in Rome?', options: ['Greek Empire', 'Roman Empire', 'Ottoman Empire', 'Persian Empire'], correctAnswerIndex: 1, difficulty: 'easy' },
    { text: 'The French Revolution began in which year?', options: ['1776', '1789', '1804', '1812'], correctAnswerIndex: 1, difficulty: 'medium' },
    { text: 'Who was the first female Prime Minister of the United Kingdom?', options: ['Margaret Thatcher', 'Theresa May', 'Angela Merkel', 'Indira Gandhi'], correctAnswerIndex: 0, difficulty: 'medium' },
    { text: 'Which explorer discovered America in 1492?', options: ['Vasco da Gama', 'Christopher Columbus', 'Ferdinand Magellan', 'Marco Polo'], correctAnswerIndex: 1, difficulty: 'easy' },
    { text: 'The Great Wall of China was primarily built to protect against which group?', options: ['Mongols', 'Japanese', 'Romans', 'Persians'], correctAnswerIndex: 0, difficulty: 'medium' },
    { text: 'Who was the architect of the Taj Mahal?', options: ['Ustad Ahmad Lahauri', 'Shah Jahan', 'Akbar', 'Mirak Mirza Ghiyas'], correctAnswerIndex: 0, difficulty: 'hard' },
    { text: 'Which ancient civilization built the Pyramids of Giza?', options: ['Mesopotamians', 'Mayans', 'Egyptians', 'Incas'], correctAnswerIndex: 2, difficulty: 'easy' }
  ],
  'Geography': [
    { text: 'What is the longest river in the world?', options: ['Amazon', 'Nile', 'Yangtze', 'Mississippi'], correctAnswerIndex: 1, difficulty: 'easy' },
    { text: 'Which is the largest country in the world by area?', options: ['Canada', 'USA', 'China', 'Russia'], correctAnswerIndex: 3, difficulty: 'easy' },
    { text: 'Mount Everest is located in which mountain range?', options: ['Andes', 'Alps', 'Himalayas', 'Rockies'], correctAnswerIndex: 2, difficulty: 'easy' },
    { text: 'Which desert is the largest hot desert in the world?', options: ['Gobi', 'Kalahari', 'Sahara', 'Thar'], correctAnswerIndex: 2, difficulty: 'easy' },
    { text: 'What is the capital city of Australia?', options: ['Sydney', 'Melbourne', 'Canberra', 'Perth'], correctAnswerIndex: 2, difficulty: 'medium' },
    { text: 'Which country is known as the "Land of the Rising Sun"?', options: ['China', 'Japan', 'South Korea', 'Thailand'], correctAnswerIndex: 1, difficulty: 'easy' },
    { text: 'The island of Sri Lanka was formerly known by what name?', options: ['Burma', 'Ceylon', 'Siam', 'Formosa'], correctAnswerIndex: 1, difficulty: 'hard' },
    { text: 'Which is the only continent that is also a country?', options: ['Africa', 'Australia', 'Antarctica', 'South America'], correctAnswerIndex: 1, difficulty: 'easy' },
    { text: 'What is the capital of Canada?', options: ['Toronto', 'Vancouver', 'Ottawa', 'Montreal'], correctAnswerIndex: 2, difficulty: 'medium' },
    { text: 'Which strait separates India and Sri Lanka?', options: ['Bering Strait', 'Strait of Malacca', 'Palk Strait', 'Strait of Hormuz'], correctAnswerIndex: 2, difficulty: 'medium' }
  ],
  'Music': [
    { text: 'How many strings does a standard guitar have?', options: ['4', '5', '6', '12'], correctAnswerIndex: 2, difficulty: 'easy' },
    { text: 'Who is known as the "King of Pop"?', options: ['Elvis Presley', 'Michael Jackson', 'Prince', 'Justin Bieber'], correctAnswerIndex: 1, difficulty: 'easy' },
    { text: 'Which musical instrument is also known as a "pianoforte"?', options: ['Organ', 'Piano', 'Harpsichord', 'Synthesizer'], correctAnswerIndex: 1, difficulty: 'medium' },
    { text: 'Who composed the "Four Seasons"?', options: ['Bach', 'Mozart', 'Beethoven', 'Vivaldi'], correctAnswerIndex: 3, difficulty: 'hard' },
    { text: 'What is the name of the lead singer of the rock band Queen?', options: ['Mick Jagger', 'Freddie Mercury', 'David Bowie', 'Robert Plant'], correctAnswerIndex: 1, difficulty: 'easy' },
    { text: 'How many members were there in the Beatles?', options: ['3', '4', '5', '6'], correctAnswerIndex: 1, difficulty: 'easy' },
    { text: 'Which pop star released the hit album "Thriller"?', options: ['Madonna', 'Prince', 'Michael Jackson', 'Whitney Houston'], correctAnswerIndex: 2, difficulty: 'easy' },
    { text: 'What is the name of the highest female singing voice?', options: ['Alto', 'Soprano', 'Mezzo-soprano', 'Contralto'], correctAnswerIndex: 1, difficulty: 'hard' },
    { text: 'Bob Marley is associated with which genre of music?', options: ['Jazz', 'Blues', 'Reggae', 'Country'], correctAnswerIndex: 2, difficulty: 'easy' },
    { text: 'Which instrument has 88 keys?', options: ['Guitar', 'Violin', 'Piano', 'Flute'], correctAnswerIndex: 2, difficulty: 'easy' }
  ],
  'Art': [
    { text: 'Who painted the ceiling of the Sistine Chapel?', options: ['Leonardo da Vinci', 'Michelangelo', 'Raphael', 'Donatello'], correctAnswerIndex: 1, difficulty: 'medium' },
    { text: 'Which art movement is Salvador Dali associated with?', options: ['Impressionism', 'Cubism', 'Surrealism', 'Pop Art'], correctAnswerIndex: 2, difficulty: 'medium' },
    { text: 'Who is the Dutch painter famous for "The Starry Night"?', options: ['Rembrandt', 'Vincent van Gogh', 'Johannes Vermeer', 'Piet Mondrian'], correctAnswerIndex: 1, difficulty: 'easy' },
    { text: 'What is the name of the famous sculpture of a man in deep thought by Auguste Rodin?', options: ['The Thinker', 'The David', 'The Kiss', 'The Discobolus'], correctAnswerIndex: 0, difficulty: 'easy' },
    { text: 'Which artist is known for cutting off his own ear?', options: ['Pablo Picasso', 'Vincent van Gogh', 'Claude Monet', 'Andy Warhol'], correctAnswerIndex: 1, difficulty: 'easy' },
    { text: 'Who painted "The Last Supper"?', options: ['Michelangelo', 'Leonardo da Vinci', 'Raphael', 'Botticelli'], correctAnswerIndex: 1, difficulty: 'easy' },
    { text: 'What is the primary color that is not Red or Blue?', options: ['Green', 'Yellow', 'Purple', 'Orange'], correctAnswerIndex: 1, difficulty: 'easy' },
    { text: 'Which artist is famous for his "Campbell\'s Soup Cans" paintings?', options: ['Jackson Pollock', 'Andy Warhol', 'Mark Rothko', 'Roy Lichtenstein'], correctAnswerIndex: 1, difficulty: 'medium' },
    { text: 'Which city is the Louvre Museum located in?', options: ['London', 'Rome', 'Paris', 'New York'], correctAnswerIndex: 2, difficulty: 'easy' },
    { text: 'What material is the Statue of Liberty made of (outer layer)?', options: ['Steel', 'Iron', 'Copper', 'Bronze'], correctAnswerIndex: 2, difficulty: 'medium' }
  ],
  'Technology': [
    { text: 'What does "WWW" stand for?', options: ['World Wide Web', 'World West Web', 'Wide World Web', 'Web World Wide'], correctAnswerIndex: 0, difficulty: 'easy' },
    { text: 'Who co-founded Microsoft?', options: ['Steve Jobs', 'Bill Gates', 'Mark Zuckerberg', 'Jeff Bezos'], correctAnswerIndex: 1, difficulty: 'easy' },
    { text: 'Which company developed the iPhone?', options: ['Samsung', 'Google', 'Apple', 'Microsoft'], correctAnswerIndex: 2, difficulty: 'easy' },
    { text: 'What is the main component of a computer that performs calculations?', options: ['RAM', 'Hard Drive', 'CPU', 'GPU'], correctAnswerIndex: 2, difficulty: 'easy' },
    { text: 'What does "PDF" stand for?', options: ['Personal Document File', 'Portable Document Format', 'Print Data File', 'Public Digital Folder'], correctAnswerIndex: 1, difficulty: 'medium' },
    { text: 'Who is considered the father of the modern computer?', options: ['Alan Turing', 'Charles Babbage', 'Ada Lovelace', 'John von Neumann'], correctAnswerIndex: 1, difficulty: 'medium' },
    { text: 'Which programming language is known for its "snake" name?', options: ['Java', 'C++', 'Python', 'Ruby'], correctAnswerIndex: 2, difficulty: 'easy' },
    { text: 'What is the most popular operating system for mobile devices globally?', options: ['iOS', 'Windows', 'Android', 'BlackBerry'], correctAnswerIndex: 2, difficulty: 'easy' },
    { text: 'In computer science, what does "RAM" stand for?', options: ['Read Access Memory', 'Random Access Memory', 'Ready Active Memory', 'Remote Application Module'], correctAnswerIndex: 1, difficulty: 'easy' },
    { text: 'Who invented the first mechanical computer?', options: ['Charles Babbage', 'Thomas Edison', 'Nikola Tesla', 'Alexander Graham Bell'], correctAnswerIndex: 0, difficulty: 'hard' }
  ],
  'Literature': [
    { text: 'Who wrote "Romeo and Juliet"?', options: ['Charles Dickens', 'William Shakespeare', 'Jane Austen', 'Mark Twain'], correctAnswerIndex: 1, difficulty: 'easy' },
    { text: 'Which book series features a young wizard named Harry Potter?', options: ['The Chronicles of Narnia', 'The Lord of the Rings', 'Harry Potter', 'Twilight'], correctAnswerIndex: 2, difficulty: 'easy' },
    { text: 'Who is the author of "The Adventures of Tom Sawyer"?', options: ['Mark Twain', 'Robert Louis Stevenson', 'Jack London', 'Herman Melville'], correctAnswerIndex: 0, difficulty: 'medium' },
    { text: 'What is the title of the first book in "The Lord of the Rings" trilogy?', options: ['The Two Towers', 'The Return of the King', 'The Fellowship of the Ring', 'The Hobbit'], correctAnswerIndex: 2, difficulty: 'medium' },
    { text: 'Who wrote the poem "The Raven"?', options: ['Walt Whitman', 'Edgar Allan Poe', 'Robert Frost', 'Emily Dickinson'], correctAnswerIndex: 1, difficulty: 'hard' },
    { text: 'Which novel begins with "Call me Ishmael"?', options: ['Ulysses', 'Moby-Dick', 'The Great Gatsby', 'War and Peace'], correctAnswerIndex: 1, difficulty: 'hard' },
    { text: 'Who wrote "Pride and Prejudice"?', options: ['Charlotte Bronte', 'Emily Bronte', 'Jane Austen', 'Mary Shelley'], correctAnswerIndex: 2, difficulty: 'medium' },
    { text: 'What is the name of the detective created by Arthur Conan Doyle?', options: ['Hercule Poirot', 'Sherlock Holmes', 'Miss Marple', 'Sam Spade'], correctAnswerIndex: 1, difficulty: 'easy' },
    { text: 'Which literary work features the characters George and Lennie?', options: ['To Kill a Mockingbird', 'Of Mice and Men', 'The Grapes of Wrath', 'East of Eden'], correctAnswerIndex: 1, difficulty: 'hard' },
    { text: 'Who is the author of "The Great Gatsby"?', options: ['F. Scott Fitzgerald', 'Ernest Hemingway', 'William Faulkner', 'John Steinbeck'], correctAnswerIndex: 0, difficulty: 'medium' }
  ],
  'Food & Drink': [
    { text: 'What is the main ingredient of hummus?', options: ['Lentils', 'Chickpeas', 'Peas', 'Beans'], correctAnswerIndex: 1, difficulty: 'easy' },
    { text: 'Which fruit is known as the "King of Fruits" in Southeast Asia?', options: ['Mango', 'Durian', 'Pineapple', 'Mangosteen'], correctAnswerIndex: 1, difficulty: 'medium' },
    { text: 'What is the most consumed beverage in the world after water?', options: ['Coffee', 'Tea', 'Beer', 'Soda'], correctAnswerIndex: 1, difficulty: 'easy' },
    { text: 'Which country is the origin of pizza?', options: ['France', 'USA', 'Italy', 'Greece'], correctAnswerIndex: 2, difficulty: 'easy' },
    { text: 'What is the main spice used in curry?', options: ['Cinnamon', 'Turmeric', 'Pepper', 'Clove'], correctAnswerIndex: 1, difficulty: 'easy' },
    { text: 'Which type of pasta has a name meaning "little worms"?', options: ['Spaghetti', 'Fettuccine', 'Vermicelli', 'Linguine'], correctAnswerIndex: 2, difficulty: 'hard' },
    { text: 'What is the main ingredient in guacamole?', options: ['Tomato', 'Onion', 'Avocado', 'Lemon'], correctAnswerIndex: 2, difficulty: 'easy' },
    { text: 'What kind of alcohol is made from fermented grapes?', options: ['Beer', 'Vodka', 'Wine', 'Whiskey'], correctAnswerIndex: 2, difficulty: 'easy' },
    { text: 'Which country produces the most coffee in the world?', options: ['Vietnam', 'Colombia', 'Ethiopia', 'Brazil'], correctAnswerIndex: 3, difficulty: 'medium' },
    { text: 'What is the name of the Japanese food consisting of vinegar rice and fish?', options: ['Ramen', 'Sashimi', 'Sushi', 'Tempura'], correctAnswerIndex: 2, difficulty: 'easy' }
  ],
  'Animals': [
    { text: 'What is the largest mammal in the world?', options: ['Elephant', 'Blue Whale', 'Giraffe', 'Hippopotamus'], correctAnswerIndex: 1, difficulty: 'easy' },
    { text: 'Which bird is the symbol of peace?', options: ['Eagle', 'Dove', 'Peacock', 'Swan'], correctAnswerIndex: 1, difficulty: 'easy' },
    { text: 'What is a group of lions called?', options: ['Pack', 'Herd', 'Pride', 'Flock'], correctAnswerIndex: 2, difficulty: 'medium' },
    { text: 'How many hearts does an octopus have?', options: ['1', '2', '3', '4'], correctAnswerIndex: 2, difficulty: 'hard' },
    { text: 'Which animal has the longest neck?', options: ['Ostrich', 'Elephant', 'Giraffe', 'Llama'], correctAnswerIndex: 2, difficulty: 'easy' },
    { text: 'What is the only mammal that can fly?', options: ['Eagle', 'Flying Squirrel', 'Bat', 'Penguin'], correctAnswerIndex: 2, difficulty: 'easy' },
    { text: 'A kangaroo carries its baby in a what?', options: ['Bag', 'Pouch', 'Sack', 'Pocket'], correctAnswerIndex: 1, difficulty: 'easy' },
    { text: 'Which animal is known to have the most powerful bite?', options: ['Lion', 'Shark', 'Crocodile', 'Hippo'], correctAnswerIndex: 2, difficulty: 'medium' },
    { text: 'How many legs does a centipede typically NOT have (despite the name)?', options: ['100', '30', '150', '200'], correctAnswerIndex: 0, difficulty: 'hard' },
    { text: 'What is the fastest land animal?', options: ['Lion', 'Cheetah', 'Horse', 'Greyhound'], correctAnswerIndex: 1, difficulty: 'easy' }
  ],
  'Space': [
    { text: 'Which planet is the largest in our solar system?', options: ['Saturn', 'Jupiter', 'Neptune', 'Earth'], correctAnswerIndex: 1, difficulty: 'easy' },
    { text: 'What is the name of the galaxy we live in?', options: ['Andromeda', 'Milky Way', 'Sombrero', 'Messier 81'], correctAnswerIndex: 1, difficulty: 'easy' },
    { text: 'What is the sun?', options: ['Planet', 'Star', 'Moon', 'Asteroid'], correctAnswerIndex: 1, difficulty: 'easy' },
    { text: 'Which planet is known as the "Morning Star"?', options: ['Mars', 'Venus', 'Mercury', 'Jupiter'], correctAnswerIndex: 1, difficulty: 'medium' },
    { text: 'How many planets are in our solar system?', options: ['7', '8', '9', '10'], correctAnswerIndex: 1, difficulty: 'easy' },
    { text: 'Who was the first human in space?', options: ['Neil Armstrong', 'Yuri Gagarin', 'John Glenn', 'Alan Shepard'], correctAnswerIndex: 1, difficulty: 'medium' },
    { text: 'What is the name of the first artificial satellite launched into space?', options: ['Explorer 1', 'Vanguard 1', 'Sputnik 1', 'Telstar'], correctAnswerIndex: 2, difficulty: 'hard' },
    { text: 'What is a "shooting star" actually?', options: ['A star dying', 'A meteor entering the atmosphere', 'An alien ship', 'A planet passing by'], correctAnswerIndex: 1, difficulty: 'medium' },
    { text: 'Which planet has rings around it?', options: ['Mars', 'Saturn', 'Venus', 'Mercury'], correctAnswerIndex: 1, difficulty: 'easy' },
    { text: 'What is the name of the biggest moon of Saturn?', options: ['Europa', 'Titan', 'Ganymede', 'Callisto'], correctAnswerIndex: 1, difficulty: 'hard' }
  ]
};

const importData = async () => {
  try {
    await connectDB();
    console.log('Cleaning existing data...');
    await Category.deleteMany();
    await Question.deleteMany();
    await User.deleteMany();
    await Icon.deleteMany();

    try {
      await Category.collection.dropIndexes();
      await User.collection.dropIndexes();
    } catch (e) {
      console.log('No indexes to drop');
    }

    console.log('Inserting icons...');
    await Icon.insertMany(icons);

    const preparedCategories = categoryTemplates.map(c => ({
      ...c,
      isGuestAllowed: c.name !== 'Current Affairs',
      guestAccess: {
        easy: true,
        medium: c.name === 'General Knowledge' || c.name === 'Space' || c.name === 'Movies',
        hard: c.name === 'General Knowledge' || c.name === 'Space'
      }
    }));

    console.log('Inserting categories...');
    const createdCategories = await Category.insertMany(preparedCategories);

    console.log('Generating questions from dataset...');
    const allQuestions: any[] = [];
    createdCategories.forEach(cat => {
      const questionsData = realQuestions[cat.name];
      if (questionsData) {
        const qs = questionsData.map(q => ({
          ...q,
          categoryId: cat._id,
          type: q.type || 'mcq',
          weightage: q.difficulty === 'easy' ? 10 : (q.difficulty === 'medium' ? 20 : 50),
          timeLimit: q.difficulty === 'easy' ? 15 : (q.difficulty === 'medium' ? 30 : 45),
          isAlternative: q.isAlternative || false,
        }));
        allQuestions.push(...qs);
      } else {
        console.warn(`No questions found for category: ${cat.name}`);
      }
    });

    await Question.insertMany(allQuestions);

    console.log('Creating users...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    await User.create([
      {
        username: 'admin',
        email: 'admin@quiz.com',
        password: hashedPassword,
        role: 'admin',
        coins: 10000,
        credits: 10
      },
      {
        username: 'player1',
        email: 'player@quiz.com',
        password: hashedPassword,
        role: 'user',
        coins: 500,
        credits: 3,
        completedLevels: [],
        categoryLevels: []
      }
    ]);

    console.log(`Successfully seeded:
    - ${createdCategories.length} Categories
    - ${allQuestions.length} Questions
    - 2 Users (admin & player1)
    - ${icons.length} Icons`);

    process.exit();
  } catch (error) {
    console.error(`Error during seeding: ${error}`);
    process.exit(1);
  }
};

importData();
