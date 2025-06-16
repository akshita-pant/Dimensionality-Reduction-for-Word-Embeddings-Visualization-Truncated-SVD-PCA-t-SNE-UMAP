/**
 * Word Visualizer Application
 * 
 * This React application provides an interactive visualization of word embeddings in 2D space.
 * It allows users to explore semantic relationships between words through their spatial positioning.
 * 
 * Key Features:
 * - Multiple model support: Load and manage different word embedding models
 * - Interactive visualization: Plot words in 2D space with hover definitions
 * - Word search: Find and highlight specific words from the active model
 * - Theme switching: Toggle between light and dark modes for better viewing
 * - Word definitions: Automatic fetching and display of word meanings on hover
 * - Part of speech tagging: Color-coded categorization of words by part of speech
 * - Paragraph analysis: Extract important words from text passages
 * 
 * Technical Stack:
 * - React for UI components and state management
 * - Emotion for styled components and theming
 * - Plotly.js for interactive data visualization
 * - PapaParse for CSV parsing
 * 
 * File Structure:
 * - Type definitions and interfaces
 * - Styled components for UI elements
 * - Main App component with state management
 * - Helper functions and API handlers
 */

import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import Plot from 'react-plotly.js';
import Papa from 'papaparse';

// ===== TYPE DEFINITIONS =====

/**
 * Theme properties for styled components
 * Used throughout the application to control dark/light mode styling
 */
interface ThemeProps {
  isDarkMode: boolean;  // Controls the color scheme of components
}

/**
 * Core data structure for word embeddings
 * Represents a single word's position in 2D space with optional metadata
 */
interface WordEmbedding {
  word: string;    // The actual word
  x: number;       // X-coordinate in the 2D embedding space
  y: number;       // Y-coordinate in the 2D embedding space
  pos?: string;    // Part of speech (noun, verb, adjective, adverb)
}

/**
 * Model structure containing a collection of word embeddings
 * Each model represents a different semantic space
 */
interface Model {
  name: string;                              // Display name of the model
  embeddings: Map<string, WordEmbedding>;    // Map of words to their embeddings
}

// ===== STYLED COMPONENTS =====

/**
 * Main container using flex layout for the application
 * Adapts colors based on the current theme
 */
const AppContainer = styled.div<ThemeProps>`
  display: flex;
  height: 100vh;
  width: 100vw;
  background-color: ${props => props.isDarkMode ? '#1a1a1a' : '#f5f5f5'};
  color: ${props => props.isDarkMode ? '#ffffff' : '#333333'};
  transition: all 0.3s ease;
`;

// Left panel containing controls and model management
const LeftPanel = styled.div<ThemeProps>`
  width: 320px;
  padding: 24px;
  background-color: ${props => props.isDarkMode ? '#2d2d2d' : '#ffffff'};
  box-shadow: ${props => props.isDarkMode ? 
    '2px 0 10px rgba(0, 0, 0, 0.5)' : 
    '2px 0 10px rgba(0, 0, 0, 0.1)'};
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;

  /* Modern scrollbar styling for better UX */
  &::-webkit-scrollbar {
    width: 8px;
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background-color: ${props => props.isDarkMode ? '#505050' : '#d1d1d1'};
    border-radius: 4px;
    
    &:hover {
      background-color: ${props => props.isDarkMode ? '#606060' : '#c1c1c1'};
    }
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  /* Firefox-specific scrollbar styling */
  scrollbar-width: thin;
  scrollbar-color: ${props => props.isDarkMode ? '#505050 transparent' : '#d1d1d1 transparent'};
`;

// Right panel containing the visualization plot
const RightPanel = styled.div<ThemeProps>`
  flex: 1;
  padding: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: ${props => props.isDarkMode ? '#1a1a1a' : '#f5f5f5'};
  position: relative;
`;

// Title components with consistent styling
const TitleWrapper = styled.div`
  margin-bottom: 24px;
  text-align: left;
`;

const MainTitle = styled.h2<ThemeProps>`
  color: ${props => props.isDarkMode ? '#ffffff' : '#333333'};
  font-size: 24px;
  font-weight: 600;
  margin: 0;
`;

const SubTitleMain = styled.h2<ThemeProps>`
  color: ${props => props.isDarkMode ? '#ffffff' : '#333333'};
  font-size: 28px;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(45deg, #007bff, #00ff9d);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const SubTitle = styled.h3<ThemeProps>`
  color: ${props => props.isDarkMode ? '#e0e0e0' : '#555555'};
  font-size: 18px;
  font-weight: 500;
  margin: 16px 0 8px 0;
`;

// Form controls with consistent theme-aware styling
const Input = styled.input<ThemeProps>`
  width: 100%;
  padding: 12px;
  margin-bottom: 8px;
  border: 1px solid ${props => props.isDarkMode ? '#404040' : '#ddd'};
  border-radius: 8px;
  background-color: ${props => props.isDarkMode ? '#404040' : '#ffffff'};
  color: ${props => props.isDarkMode ? '#ffffff' : '#333333'};
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }

  &::placeholder {
    color: ${props => props.isDarkMode ? '#888888' : '#999999'};
  }
`;

const Button = styled.button<ThemeProps>`
  width: 100%;
  padding: 12px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
  margin-bottom: 8px;

  &:hover:not(:disabled) {
    background-color: #0056b3;
    transform: translateY(-1px);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    background-color: ${props => props.isDarkMode ? '#404040' : '#e0e0e0'};
    color: ${props => props.isDarkMode ? '#666666' : '#999999'};
    cursor: not-allowed;
  }
`;

// Theme toggle button positioned in the bottom-right corner
const ThemeToggle = styled.button<ThemeProps>`
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 10px;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  font-size: 20px;
  background-color: ${props => props.isDarkMode ? '#333333' : '#ffffff'};
  color: ${props => props.isDarkMode ? '#ffffff' : '#333333'};
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.3s ease;
  z-index: 1000;
  
  &:hover {
    transform: scale(1.05);
  }
`;

const RemoveButton = styled.button<ThemeProps>`
  background: none;
  border: none;
  color: ${props => props.isDarkMode ? '#ffffff' : '#000000'};
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
  opacity: 0.7;
  font-size: 18px;

  &:hover {
    opacity: 1;
    background-color: ${props => props.isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
  }
`;

const WordList = styled.div<ThemeProps>`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
`;

// WordItem with hover effect for definitions
const WordItem = styled.div<ThemeProps>`
  padding: 8px 12px;
  background-color: ${props => props.isDarkMode ? '#404040' : '#f0f0f0'};
  border-radius: 6px;
  color: ${props => props.isDarkMode ? '#ffffff' : '#333333'};
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.3s ease;
  position: relative;

  &:hover {
    background-color: ${props => props.isDarkMode ? '#505050' : '#e0e0e0'};
  }
`;

// Tooltip for word definitions on hover
const WordTooltip = styled.div<ThemeProps>`
  position: absolute;
  bottom: calc(100% + 5px);
  left: 0;
  background-color: ${props => props.isDarkMode ? '#404040' : '#ffffff'};
  border: 1px solid ${props => props.isDarkMode ? '#505050' : '#e0e0e0'};
  color: ${props => props.isDarkMode ? '#ffffff' : '#333333'};
  padding: 8px 12px;
  border-radius: 4px;
  z-index: 1000;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
  min-width: 200px;
  max-width: 300px;
  font-size: 14px;
  
  &:after {
    content: '';
    position: absolute;
    top: 100%;
    left: 15px;
    border-width: 5px;
    border-style: solid;
    border-color: ${props => props.isDarkMode ? '#404040 transparent transparent' : '#ffffff transparent transparent'};
  }
`;

const ErrorMessage = styled.div<ThemeProps>`
  color: #ff4d4d;
  margin-bottom: 10px;
  font-size: 14px;
  padding: 8px 12px;
  background-color: ${props => props.isDarkMode ? 'rgba(255, 77, 77, 0.1)' : 'rgba(255, 77, 77, 0.05)'};
  border-radius: 6px;
  border-left: 3px solid #ff4d4d;
`;

const SuccessMessage = styled.div<ThemeProps>`
  color: #4CAF50;
  margin-bottom: 10px;
  font-size: 14px;
  padding: 8px 12px;
  background-color: ${props => props.isDarkMode ? 'rgba(76, 175, 80, 0.1)' : 'rgba(76, 175, 80, 0.05)'};
  border-radius: 6px;
  border-left: 3px solid #4CAF50;
`;

const LoadingOverlay = styled.div<ThemeProps>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background-color: ${props => props.isDarkMode ? '#2d2d2d' : '#f0f0f0'};
  z-index: 2000;
  overflow: hidden;
`;

const LoadingBar = styled.div<ThemeProps>`
  height: 100%;
  background-color: #00ff9d;
  box-shadow: 0 0 10px #00ff9d;
  width: 100px;
  position: absolute;
  will-change: transform;
  transform: translateX(-100px);
  animation: loading 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;

  @keyframes loading {
    0% {
      transform: translateX(-100px);
    }
    100% {
      transform: translateX(100vw);
    }
  }
`;

const FileInput = styled.div<ThemeProps>`
  position: relative;
  width: 100%;
  margin-bottom: 8px;

  input[type="file"] {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
  }

  &::before {
    content: 'Choose CSV File';
    display: block;
    padding: 12px;
    background-color: ${props => props.isDarkMode ? '#404040' : '#ffffff'};
    border: 1px solid ${props => props.isDarkMode ? '#404040' : '#ddd'};
    border-radius: 8px;
    color: ${props => props.isDarkMode ? '#ffffff' : '#333333'};
    text-align: center;
    transition: all 0.3s ease;
  }

  &:hover::before {
    background-color: ${props => props.isDarkMode ? '#505050' : '#e8e8e8'};
  }
`;

const ModelName = styled.div<ThemeProps>`
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  color: ${props => props.isDarkMode ? '#ffffff80' : '#33333380'};
  font-size: 16px;
  font-weight: 500;
  z-index: 1;
`;

// Paragraph item with expand/collapse functionality
const ParagraphItem = styled.div<ThemeProps & { isActive?: boolean }>`
  padding: 10px 12px;
  background-color: ${props => 
    props.isActive 
      ? (props.isDarkMode ? '#505050' : '#e0e0e0') 
      : (props.isDarkMode ? '#404040' : '#f0f0f0')
  };
  border-radius: 6px;
  color: ${props => props.isDarkMode ? '#ffffff' : '#333333'};
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  margin-bottom: 8px;

  &:hover {
    background-color: ${props => props.isDarkMode ? '#505050' : '#e0e0e0'};
  }
`;

const ParagraphHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
`;

const ParagraphActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ExpandButton = styled.button<ThemeProps>`
  background: none;
  border: none;
  color: ${props => props.isDarkMode ? '#ffffff' : '#000000'};
  cursor: pointer;
  padding: 4px;
  font-size: 16px;
  opacity: 0.7;
  
  &:hover {
    opacity: 1;
  }
`;

const ParagraphContent = styled.div<ThemeProps>`
  margin-top: 8px;
  padding: 8px;
  background-color: ${props => props.isDarkMode ? '#333333' : '#e8e8e8'};
  border-radius: 4px;
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
`;

// Add a TextArea component for paragraph input
const TextArea = styled.textarea<ThemeProps>`
  width: 100%;
  padding: 12px;
  margin-bottom: 8px;
  border: 1px solid ${props => props.isDarkMode ? '#404040' : '#ddd'};
  border-radius: 8px;
  background-color: ${props => props.isDarkMode ? '#404040' : '#ffffff'};
  color: ${props => props.isDarkMode ? '#ffffff' : '#333333'};
  transition: all 0.3s ease;
  min-height: 100px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }

  &::placeholder {
    color: ${props => props.isDarkMode ? '#888888' : '#999999'};
  }
`;

// ===== MAIN APPLICATION COMPONENT =====

function App() {
  /**
   * State Management
   * Using React's useState hook for managing application state
   */
  const [models, setModels] = useState<Model[]>([]);                              // Array of all loaded embedding models
  const [activeModelIndex, setActiveModelIndex] = useState<number>(-1);           // Index of the currently selected model (-1 if none)
  const [searchWord, setSearchWord] = useState('');                               // Current word being searched
  const [highlightedWords, setHighlightedWords] = useState<string[]>([]);         // Words currently displayed on the plot
  const [error, setError] = useState<string>('');                                 // Error message for user feedback
  const [success, setSuccess] = useState<string>('');                             // Success message for user feedback
  const [isDarkMode, setIsDarkMode] = useState(false);                            // Theme state (true for dark mode)
  const [isLoading, setIsLoading] = useState(false);                               // Loading state for async operations
  const [wordMeanings, setWordMeanings] = useState<Map<string, string>>(new Map());  // Cache for fetched word definitions
  const [wordPos, setWordPos] = useState<Map<string, string>>(new Map());           // Cache for word parts of speech
  const [paragraph, setParagraph] = useState('');                                    // Paragraph input text
  const [savedParagraphs, setSavedParagraphs] = useState<{id: string; text: string; words: string[]}[]>([]);  // Saved paragraphs with their words
  const [activeParagraphId, setActiveParagraphId] = useState<string | null>(null);     // Currently active paragraph
  const [expandedParagraphId, setExpandedParagraphId] = useState<string | null>(null);  // Currently expanded paragraph
  const [hoveredWord, setHoveredWord] = useState<string | null>(null);              // Currently hovered word for plot highlighting
  const plotRef = React.useRef<any>(null);                                           // Reference to the Plot component
  
  /**
   * HoverableWordItem Component
   * A word item with hover functionality to highlight corresponding word in plot
   */
  const HoverableWordItem = ({ 
    word, 
    pos, 
    isDarkMode, 
    onRemove 
  }: { 
    word: string; 
    pos: string; 
    isDarkMode: boolean; 
    onRemove: () => void;
  }) => {
    return (
      <WordItem 
        isDarkMode={isDarkMode}
        onMouseEnter={() => {
          setHoveredWord(word.toLowerCase());
        }}
        onMouseLeave={() => {
          setHoveredWord(null);
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', backgroundColor: getPosColor(pos), borderRadius: '50%' }}></div>
          {word}
        </div>
        <RemoveButton
          isDarkMode={isDarkMode}
          onClick={onRemove}
          title="Remove word"
        >
          ×
        </RemoveButton>
      </WordItem>
    );
  };

  /**
   * File Upload Handler
   * Processes CSV files containing word embeddings
   * 
   * CSV Format Requirements:
   * - Each row: x,y,word
   * - x: X-coordinate (number)
   * - y: Y-coordinate (number)
   * - word: The word being embedded (string)
   * 
   * Example CSV row: 0.123,0.456,apple
   */
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsLoading(true);
      setError('');
      Papa.parse(file, {
        complete: (results) => {
          const embeddingsMap = new Map<string, WordEmbedding>();
          let invalidCount = 0;
          
          // Process each row of the CSV
          results.data.forEach((row: any, index: number) => {
            // Skip header row or invalid structure
            if (!Array.isArray(row) || row.length < 3) return;

            // Extract and clean data
            const rawWord = String(row[2]).trim();
            const word = rawWord.replace(/^["']|["']$/g, '');  // Remove quotes if present
            const xStr = String(row[0]).replace(/^["']|["']$/g, '').trim();
            const yStr = String(row[1]).replace(/^["']|["']$/g, '').trim();

            // Skip empty or invalid words
            if (!word || word === '.') return;

            // Parse coordinates
            const x = Number(xStr);
            const y = Number(yStr);

            // Validate coordinates
            if (isNaN(x) || isNaN(y)) {
              invalidCount++;
              return;
            }

            // Use cached POS information if available
            const lowerWord = word.toLowerCase();
            const pos = wordPos.get(lowerWord);
            
            // Store valid embedding (include POS if available)
            embeddingsMap.set(lowerWord, { word, x, y, pos });
          });

          // Validate results and create new model
          if (embeddingsMap.size === 0) {
            setError('No valid embeddings found in file');
            setIsLoading(false);
            return;
          }

          // Create and add new model
          const newModel: Model = {
            name: file.name.replace(/\.[^/.]+$/, ""),  // Remove file extension
            embeddings: embeddingsMap
          };
          
          setModels(prevModels => [...prevModels, newModel]);
          setActiveModelIndex(models.length);  // Set the new model as active
          
          // Show success message with stats
          setSuccess(`Model loaded with ${embeddingsMap.size} words${invalidCount > 0 ? ` (${invalidCount} invalid entries skipped)` : ''}`);
          setIsLoading(false);
        },
        error: (error) => {
          console.error('Error parsing CSV:', error);
          setError('Error parsing CSV file');
          setIsLoading(false);
        },
        skipEmptyLines: true,
      });
    }
  };

  /**
   * Word Search Handler
   * Validates and adds words to the visualization
   * 
   * Process:
   * 1. Validates input word and active model
   * 2. Checks if word exists in current model
   * 3. Adds word to visualization if not already present
   */
  const handleSearch = async () => {
    const word = searchWord.trim().toLowerCase();
    if (!word) return;

    if (activeModelIndex === -1) {
      setError('Please select a model first');
      setSuccess('');
      return;
    }

    const activeModel = models[activeModelIndex];
    
    if (!activeModel.embeddings.has(word)) {
      setError(`Word "${word}" not found in the model`);
      setSuccess('');
      return;
    }

    if (!highlightedWords.includes(word)) {
      setIsLoading(true);
      
      // Determine part of speech if not already known
      let pos = wordPos.get(word) || 'unknown';
      if (!wordPos.has(word)) {
        try {
          pos = await getWordPosDirectly(word);
          
          // Save the POS to state for future use
          setWordPos(prev => new Map(prev).set(word.toLowerCase(), pos));
          
          // Update model with the POS information
          const updatedModels = [...models];
          const embedding = updatedModels[activeModelIndex].embeddings.get(word);
          if (embedding) {
            embedding.pos = pos;
            updatedModels[activeModelIndex].embeddings.set(word, embedding);
            setModels(updatedModels);
          }
        } catch (error) {
          console.error(`Error determining part of speech for "${word}":`, error);
          // Default to unknown in case of error
          pos = 'unknown';
          setWordPos(prev => new Map(prev).set(word.toLowerCase(), pos));
        }
      }
      
      // Now add the word to highlighted words
      setHighlightedWords(prev => [...prev, word]);
      setSuccess(`Added the word "${word}" to visualization`);
      setError('');
      setIsLoading(false);
    } else {
      setError(`Word "${word}" is already visualized`);
      setSuccess('');
    }
    setSearchWord('');
  };

  /**
   * Word Data Fetcher
   * Retrieves definitions and part of speech from the Dictionary API
   * Implements caching to avoid redundant API calls
   * 
   * @param word - The word to fetch the data for
   */
  const fetchWordData = async (word: string) => {
    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
      const data = await response.json();
      
      if (data && data[0] && data[0].meanings && data[0].meanings[0]) {
        // Get definition
        const meaning = data[0].meanings[0].definitions[0].definition;
        setWordMeanings(prev => new Map(prev).set(word.toLowerCase(), meaning));
        
        // Get part of speech
        const partOfSpeech = data[0].meanings[0].partOfSpeech;
        
        // Normalize the part of speech to our categories
        let normalizedPos = 'unknown'; // Default to unknown
        if (partOfSpeech === 'noun') normalizedPos = 'noun';
        else if (partOfSpeech === 'verb') normalizedPos = 'verb';
        else if (partOfSpeech === 'adjective') normalizedPos = 'adjective';
        else if (partOfSpeech === 'adverb') normalizedPos = 'adverb';
        
        setWordPos(prev => new Map(prev).set(word.toLowerCase(), normalizedPos));
        
        // Update model with POS information
        if (activeModelIndex !== -1) {
          const updatedModels = [...models];
          const embedding = updatedModels[activeModelIndex].embeddings.get(word.toLowerCase());
          if (embedding) {
            embedding.pos = normalizedPos;
            updatedModels[activeModelIndex].embeddings.set(word.toLowerCase(), embedding);
            setModels(updatedModels);
          }
        }
      }
    } catch (error) {
      console.log(`Could not fetch data for ${word}`);
      // Set to unknown if fetch fails
      setWordPos(prev => new Map(prev).set(word.toLowerCase(), 'unknown'));
    }
  };

  /**
   * Effect Hook for Word Data
   * Automatically fetches definitions and parts of speech for newly added words
   * Uses caches to avoid duplicate requests
   */
  useEffect(() => {
    const fetchData = async () => {
      for (const word of highlightedWords) {
        const lowerWord = word.toLowerCase();
        
        // Fetch data if not already cached
        if (!wordMeanings.has(lowerWord) || !wordPos.has(lowerWord)) {
          await fetchWordData(lowerWord);
        }
      }
    };
    
    fetchData();
  }, [highlightedWords, wordMeanings, wordPos, models, activeModelIndex]);

  /**
   * Part of Speech Color Mapping
   * Returns a color based on the part of speech
   */
  const getPosColor = (pos?: string) => {
    switch (pos) {
      case 'noun':
        return '#4285F4'; // blue
      case 'verb':
        return '#EA4335'; // red
      case 'adjective':
        return '#FBBC05'; // yellow
      case 'adverb':
        return '#34A853'; // green
      default:
        return '#9E9E9E'; // gray for unknown
    }
  };

  /**
   * Data Processing for Visualization
   * Filters and prepares embedding data for the plot
   * Groups words by part of speech for separate trace rendering
   */
  const visibleEmbeddings = activeModelIndex !== -1
    ? highlightedWords
        // Filter by active paragraph if one is selected
        .filter(word => {
          if (!activeParagraphId) return true;
          const activeParagraph = savedParagraphs.find(p => p.id === activeParagraphId);
          return activeParagraph ? activeParagraph.words.includes(word) : true;
        })
        .map(word => models[activeModelIndex].embeddings.get(word))
        .filter((embedding): embedding is WordEmbedding => embedding !== undefined)
    : [];

  // Group embeddings by part of speech
  const groupedEmbeddings = {
    noun: visibleEmbeddings.filter(e => e.pos === 'noun'),
    verb: visibleEmbeddings.filter(e => e.pos === 'verb'),
    adjective: visibleEmbeddings.filter(e => e.pos === 'adjective'),
    adverb: visibleEmbeddings.filter(e => e.pos === 'adverb'),
    unknown: visibleEmbeddings.filter(e => !e.pos || (e.pos !== 'noun' && e.pos !== 'verb' && e.pos !== 'adjective' && e.pos !== 'adverb'))
  };

  /**
   * Plot Configuration
   * Defines the layout and styling for the Plotly visualization
   * Responsive to theme changes and window size
   */
  const plotLayout = {
    width: window.innerWidth - 400,
    height: window.innerHeight - 100,
    title: 'Word Embeddings Visualization',
    hovermode: 'closest' as const,
    paper_bgcolor: isDarkMode ? '#1a1a1a' : '#f5f5f5',
    plot_bgcolor: isDarkMode ? '#1a1a1a' : '#f5f5f5',
    font: {
      color: isDarkMode ? '#ffffff' : '#333333',
    },
    xaxis: {
      title: 'X',
      gridcolor: isDarkMode ? '#333333' : '#ddd',
      zerolinecolor: isDarkMode ? '#333333' : '#ddd',
    },
    yaxis: {
      title: 'Y',
      gridcolor: isDarkMode ? '#333333' : '#ddd',
      zerolinecolor: isDarkMode ? '#333333' : '#ddd',
    },
    legend: {
      title: {
        text: 'Parts of Speech',
        font: {
          color: isDarkMode ? '#ffffff' : '#333333',
        }
      },
      font: {
        color: isDarkMode ? '#ffffff' : '#333333',
      },
      bgcolor: isDarkMode ? '#2d2d2d' : '#ffffff',
      bordercolor: isDarkMode ? '#404040' : '#ddd',
    },
    hoverlabel: {
      align: 'left' as const,
      bgcolor: isDarkMode ? '#404040' : '#ffffff',
      bordercolor: isDarkMode ? '#505050' : '#e0e0e0',
      font: {
        color: isDarkMode ? '#ffffff' : '#333333',
        size: 14
      }
    }
  };

  /**
   * Model Management Functions
   * Handle model selection, removal, and related state updates
   */
  
  // Removes a model and handles related state cleanup
  const removeModel = (indexToRemove: number) => {
    setModels(prevModels => prevModels.filter((_, index) => index !== indexToRemove));
    if (activeModelIndex === indexToRemove) {
      setActiveModelIndex(-1);
      setHighlightedWords([]);
      setError('');
      setSuccess('');
    } else if (activeModelIndex > indexToRemove) {
      setActiveModelIndex(activeModelIndex - 1);
    }
  };

  // Handles model selection and updates highlighted words
  const selectModel = (index: number) => {
    if (index === activeModelIndex) return;
    
    // Get the new model
    const newModel = models[index];
    
    // Update POS information for the new model from existing cache
    const updatedModels = [...models];
    updatedModels[index] = {
      ...newModel,
      embeddings: new Map(newModel.embeddings)
    };
    
    // Apply cached POS information to the new model's embeddings
    for (const [word, pos] of wordPos.entries()) {
      const embedding = updatedModels[index].embeddings.get(word);
      if (embedding) {
        embedding.pos = pos;
        updatedModels[index].embeddings.set(word, embedding);
      }
    }
    
    // Update state
    setModels(updatedModels);
    setActiveModelIndex(index);
    
    // Filter highlighted words to those present in new model
    setHighlightedWords(prevWords => 
      prevWords.filter(word => newModel.embeddings.has(word))
    );
    
    setError('');
    setSuccess('');
  };

  // Removes a word from the visualization
  const removeWord = (wordToRemove: string) => {
    setHighlightedWords(highlightedWords.filter(word => word !== wordToRemove));
  };
  
  // Toggles a paragraph as active
  const toggleActiveParagraph = (paragraphId: string) => {
    if (activeParagraphId === paragraphId) {
      // If already active, deactivate it (show all words)
      setActiveParagraphId(null);
    } else {
      // Activate this paragraph (show only its words)
      setActiveParagraphId(paragraphId);
    }
  };
  
  // Toggles paragraph expansion to show full text
  const toggleExpandParagraph = (paragraphId: string) => {
    if (expandedParagraphId === paragraphId) {
      setExpandedParagraphId(null);
    } else {
      setExpandedParagraphId(paragraphId);
    }
  };
  
  // Removes a paragraph and its associated words
  const removeParagraph = (paragraphId: string) => {
    // Find the paragraph to remove
    const paragraphToRemove = savedParagraphs.find(p => p.id === paragraphId);
    
    if (!paragraphToRemove) return;
    
    // Remove the paragraph's words from highlighted words
    setHighlightedWords(prev => 
      prev.filter(word => !paragraphToRemove.words.includes(word))
    );
    
    // Remove the paragraph from saved paragraphs
    setSavedParagraphs(prev => prev.filter(p => p.id !== paragraphId));
    
    // If this was the active paragraph, clear active state
    if (activeParagraphId === paragraphId) {
      setActiveParagraphId(null);
    }
    
    // If this was the expanded paragraph, clear expanded state
    if (expandedParagraphId === paragraphId) {
      setExpandedParagraphId(null);
    }
  };

  // Helper function to format meaning text with line breaks
  const formatMeaning = (meaning: string): string => {
    // Split meaning into chunks of approximately 40 characters at word boundaries
    if (!meaning) return '';
    
    const maxLineLength = 40;
    let result = '';
    let currentLine = '';
    
    // Split by words
    const words = meaning.split(' ');
    
    for (const word of words) {
      // If adding this word would exceed the line length, add a line break
      if (currentLine.length + word.length + 1 > maxLineLength) {
        result += currentLine + '<br>';
        currentLine = word + ' ';
      } else {
        currentLine += word + ' ';
      }
    }
    
    // Add the last line
    if (currentLine) {
      result += currentLine;
    }
    
    return result;
  };

  // Create a separate trace for each part of speech
  const plotData = [
    {
      name: `Nouns (${groupedEmbeddings.noun.length})`,
      x: groupedEmbeddings.noun.map(e => e.x),
      y: groupedEmbeddings.noun.map(e => e.y),
      text: groupedEmbeddings.noun.map(e => e.word.toLowerCase()),
      mode: 'text+markers' as const,
      type: 'scatter' as const,
      textposition: 'top center' as const,
      marker: {
        size: 10,
        color: getPosColor('noun'),
      },
      hoverinfo: 'text' as const,
      hoverlabel: {
        bgcolor: isDarkMode ? '#404040' : '#ffffff',
        bordercolor: isDarkMode ? '#505050' : '#e0e0e0',
        font: { 
          color: isDarkMode ? '#ffffff' : '#333333',
          size: 14 
        }
      },
      hovertemplate: groupedEmbeddings.noun.map(e => {
        const meaning = wordMeanings.get(e.word.toLowerCase());
        return meaning 
          ? `<b>${e.word.toLowerCase()}</b> (noun)<br><br>${formatMeaning(meaning)}<extra></extra>`
          : `<b>${e.word.toLowerCase()}</b> (noun)<extra></extra>`;
      }),
    },
    {
      name: `Verbs (${groupedEmbeddings.verb.length})`,
      x: groupedEmbeddings.verb.map(e => e.x),
      y: groupedEmbeddings.verb.map(e => e.y),
      text: groupedEmbeddings.verb.map(e => e.word.toLowerCase()),
      mode: 'text+markers' as const,
      type: 'scatter' as const,
      textposition: 'top center' as const,
      marker: {
        size: 10,
        color: getPosColor('verb'),
      },
      hoverinfo: 'text' as const,
      hoverlabel: {
        bgcolor: isDarkMode ? '#404040' : '#ffffff',
        bordercolor: isDarkMode ? '#505050' : '#e0e0e0',
        font: { 
          color: isDarkMode ? '#ffffff' : '#333333',
          size: 14 
        }
      },
      hovertemplate: groupedEmbeddings.verb.map(e => {
        const meaning = wordMeanings.get(e.word.toLowerCase());
        return meaning 
          ? `<b>${e.word.toLowerCase()}</b> (verb)<br><br>${formatMeaning(meaning)}<extra></extra>`
          : `<b>${e.word.toLowerCase()}</b> (verb)<extra></extra>`;
      }),
    },
    {
      name: `Adjectives (${groupedEmbeddings.adjective.length})`,
      x: groupedEmbeddings.adjective.map(e => e.x),
      y: groupedEmbeddings.adjective.map(e => e.y),
      text: groupedEmbeddings.adjective.map(e => e.word.toLowerCase()),
      mode: 'text+markers' as const,
      type: 'scatter' as const,
      textposition: 'top center' as const,
      marker: {
        size: 10,
        color: getPosColor('adjective'),
      },
      hoverinfo: 'text' as const,
      hoverlabel: {
        bgcolor: isDarkMode ? '#404040' : '#ffffff',
        bordercolor: isDarkMode ? '#505050' : '#e0e0e0',
        font: { 
          color: isDarkMode ? '#ffffff' : '#333333',
          size: 14 
        }
      },
      hovertemplate: groupedEmbeddings.adjective.map(e => {
        const meaning = wordMeanings.get(e.word.toLowerCase());
        return meaning 
          ? `<b>${e.word.toLowerCase()}</b> (adjective)<br><br>${formatMeaning(meaning)}<extra></extra>`
          : `<b>${e.word.toLowerCase()}</b> (adjective)<extra></extra>`;
      }),
    },
    {
      name: `Adverbs (${groupedEmbeddings.adverb.length})`,
      x: groupedEmbeddings.adverb.map(e => e.x),
      y: groupedEmbeddings.adverb.map(e => e.y),
      text: groupedEmbeddings.adverb.map(e => e.word.toLowerCase()),
      mode: 'text+markers' as const,
      type: 'scatter' as const,
      textposition: 'top center' as const,
      marker: {
        size: 10,
        color: getPosColor('adverb'),
      },
      hoverinfo: 'text' as const,
      hoverlabel: {
        bgcolor: isDarkMode ? '#404040' : '#ffffff',
        bordercolor: isDarkMode ? '#505050' : '#e0e0e0',
        font: { 
          color: isDarkMode ? '#ffffff' : '#333333',
          size: 14 
        }
      },
      hovertemplate: groupedEmbeddings.adverb.map(e => {
        const meaning = wordMeanings.get(e.word.toLowerCase());
        return meaning 
          ? `<b>${e.word.toLowerCase()}</b> (adverb)<br><br>${formatMeaning(meaning)}<extra></extra>`
          : `<b>${e.word.toLowerCase()}</b> (adverb)<extra></extra>`;
      }),
    },
    {
      name: `Others/Unknown (${groupedEmbeddings.unknown.length})`,
      x: groupedEmbeddings.unknown.map(e => e.x),
      y: groupedEmbeddings.unknown.map(e => e.y),
      text: groupedEmbeddings.unknown.map(e => e.word.toLowerCase()),
      mode: 'text+markers' as const,
      type: 'scatter' as const,
      textposition: 'top center' as const,
      marker: {
        size: 10,
        color: getPosColor('unknown'),
      },
      hoverinfo: 'text' as const,
      hoverlabel: {
        bgcolor: isDarkMode ? '#404040' : '#ffffff',
        bordercolor: isDarkMode ? '#505050' : '#e0e0e0',
        font: { 
          color: isDarkMode ? '#ffffff' : '#333333',
          size: 14 
        }
      },
      hovertemplate: groupedEmbeddings.unknown.map(e => {
        const meaning = wordMeanings.get(e.word.toLowerCase());
        return meaning 
          ? `<b>${e.word.toLowerCase()}</b> (unknown)<br><br>${formatMeaning(meaning)}<extra></extra>`
          : `<b>${e.word.toLowerCase()}</b> (unknown)<extra></extra>`;
      }),
    },
  ] as any;

  /**
   * Paragraph Processing Function
   * Extracts words from the input paragraph that match criteria
   * 
   * Process:
   * 1. Splits paragraph into all words
   * 2. Checks if words exist in the current model
   * 3. Filters for words that are nouns, verbs, adjectives, or adverbs via API
   * 4. Adds matching words to the visualization
   */
  const handleParagraphSubmit = () => {
    if (!paragraph.trim()) return;
    
    if (activeModelIndex === -1) {
      setError('Please select a model first');
      setSuccess('');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');
    
    const activeModel = models[activeModelIndex];
    const paragraphText = paragraph.trim();
    
    // Extract ALL words from paragraph
    const words = paragraphText
      .toLowerCase()
      .replace(/[^\w\s]|_/g, " ")  // Replace punctuation with spaces
      .replace(/\s+/g, " ")         // Replace multiple spaces with single space
      .trim()
      .split(" ")
      .filter(word => 
        word.length > 0 && // Keep non-empty words
        !/\d/.test(word)   // Exclude words containing numbers
      );
    
    // Find unique words that exist in the model (remove duplicates)
    const foundWords = [...new Set(words)].filter(word => activeModel.embeddings.has(word));
    
    if (foundWords.length === 0) {
      setError('No words from the paragraph were found in the model');
      setIsLoading(false);
      return;
    }
    
    // Process each word to determine its part of speech
    const processParagraphWords = async () => {
      // Arrays to track stats and words to add
      const wordsToAdd: string[] = [];
      let nounsAdded = 0;
      let verbsAdded = 0;
      let adjectivesAdded = 0;
      let adverbsAdded = 0;
      
      // Process words in batches to avoid overwhelming the API
      const batchSize = 25;
      
      for (let i = 0; i < foundWords.length; i += batchSize) {
        const batch = foundWords.slice(i, i + batchSize);
        
        // Process batch in parallel
        const batchPromises = batch.map(async (word) => {
          // Skip if already in highlighted words
          if (highlightedWords.includes(word)) return null;
          
          // Use cached POS if available
          if (wordPos.has(word)) {
            const pos = wordPos.get(word);
            if (pos === 'noun') nounsAdded++;
            else if (pos === 'verb') verbsAdded++;
            else if (pos === 'adjective') adjectivesAdded++;
            else if (pos === 'adverb') adverbsAdded++;
            return word; // Return word to add
          }
          
          // Fetch part of speech data directly
          try {
            const pos = await getWordPosDirectly(word);
            
            // Save the POS to state for future use (without awaiting)
            setWordPos(prev => new Map(prev).set(word.toLowerCase(), pos));
            
            // Update model with POS information (without awaiting)
            if (activeModelIndex !== -1) {
              const updatedModels = [...models];
              const embedding = updatedModels[activeModelIndex].embeddings.get(word.toLowerCase());
              if (embedding) {
                embedding.pos = pos;
                updatedModels[activeModelIndex].embeddings.set(word.toLowerCase(), embedding);
                setModels(updatedModels);
              }
            }
            
            // Count the word based on its part of speech
            if (pos === 'noun') nounsAdded++;
            else if (pos === 'verb') verbsAdded++;
            else if (pos === 'adjective') adjectivesAdded++;
            else if (pos === 'adverb') adverbsAdded++;
            
            return word; // Return word to add regardless of POS
          } catch (error) {
            console.error(`Error processing word: ${word}`, error);
            
            // If there's an error, still add the word with default part of speech
            setWordPos(prev => new Map(prev).set(word.toLowerCase(), 'unknown'));
            
            // Update model with default POS information
            if (activeModelIndex !== -1) {
              const updatedModels = [...models];
              const embedding = updatedModels[activeModelIndex].embeddings.get(word.toLowerCase());
              if (embedding) {
                embedding.pos = 'unknown';
                updatedModels[activeModelIndex].embeddings.set(word.toLowerCase(), embedding);
                setModels(updatedModels);
              }
            }
            
            // Still return word to add despite error (goes into unknown category)
            return word;
          }
        });
        
        // Process batch results
        const batchResults = await Promise.all(batchPromises);
        wordsToAdd.push(...batchResults.filter((word): word is string => word !== null));
        
        // Small delay to avoid rate limiting
        if (i + batchSize < foundWords.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      // Update state with all collected words
      if (wordsToAdd.length > 0) {
        // Create a new array to ensure state update triggers
        const newHighlightedWords = [...highlightedWords, ...wordsToAdd];
        
        // Create a unique ID for this paragraph
        const paragraphId = `para-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        
        // Store the paragraph with its associated words
        setSavedParagraphs(prev => [
          ...prev, 
          {
            id: paragraphId,
            text: paragraphText,
            words: wordsToAdd
          }
        ]);
        
        setHighlightedWords(newHighlightedWords);
        
        // Display result message
        const stats: string[] = [];
        if (nounsAdded > 0) stats.push(`${nounsAdded} ${nounsAdded === 1 ? 'noun' : 'nouns'}`);
        if (verbsAdded > 0) stats.push(`${verbsAdded} ${verbsAdded === 1 ? 'verb' : 'verbs'}`);
        if (adjectivesAdded > 0) stats.push(`${adjectivesAdded} ${adjectivesAdded === 1 ? 'adjective' : 'adjectives'}`);
        if (adverbsAdded > 0) stats.push(`${adverbsAdded} ${adverbsAdded === 1 ? 'adverb' : 'adverbs'}`);
        
        setSuccess(`Added ${wordsToAdd.length} ${wordsToAdd.length === 1 ? 'word' : 'words'} from paragraph (${stats.join(', ')})`);
        setError('');
      } else {
        setError('No new important words (nouns, verbs, adjectives, adverbs) found in the paragraph');
        setSuccess('');
      }
      
      setIsLoading(false);
      setParagraph('');
    };
    
    processParagraphWords();
  };
  
  /**
   * Get word part of speech directly from API
   * Returns the result directly without going through state
   */
  const getWordPosDirectly = async (word: string): Promise<string> => {
    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
      const data = await response.json();
      
      if (data && data[0] && data[0].meanings && data[0].meanings[0]) {
        // Get definition (save to state for future, but don't await)
        const meaning = data[0].meanings[0].definitions[0].definition;
        setWordMeanings(prev => new Map(prev).set(word.toLowerCase(), meaning));
        
        // Get part of speech
        const partOfSpeech = data[0].meanings[0].partOfSpeech;
        
        // Normalize the part of speech to our categories
        if (partOfSpeech === 'noun') return 'noun';
        else if (partOfSpeech === 'verb') return 'verb';
        else if (partOfSpeech === 'adjective') return 'adjective';
        else if (partOfSpeech === 'adverb') return 'adverb';
        else return 'unknown'; // Any other part of speech goes to unknown
      }
    } catch (error) {
      console.log(`Could not fetch data for ${word}`);
    }
    
    // Default to 'unknown' if no data found or error occurred
    return 'unknown';
  };

  // Effect to handle word hover in plot
  useEffect(() => {
    if (!plotRef.current || !hoveredWord) return;
    
    // Find the trace and point index for the hovered word
    let foundTrace = -1;
    let foundPoint = -1;
    
    // Check each trace (noun, verb, etc.)
    for (let traceIndex = 0; traceIndex < plotData.length; traceIndex++) {
      const trace = plotData[traceIndex];
      if (!trace || !trace.text) continue;
      
      // Find the word in the trace's text array
      const pointIndex = trace.text.findIndex((t: string) => t === hoveredWord);
      if (pointIndex !== -1) {
        foundTrace = traceIndex;
        foundPoint = pointIndex;
        break;
      }
    }
    
    // If found, trigger the hover
    if (foundTrace !== -1 && foundPoint !== -1) {
      // Safely access Plotly
      try {
        const plotlyInstance = window && (window as any).Plotly;
        const plotDiv = document.querySelector('.js-plotly-plot');
        
        if (plotlyInstance && plotlyInstance.Fx && plotDiv) {
          plotlyInstance.Fx.hover(
            plotDiv, 
            [{ curveNumber: foundTrace, pointNumber: foundPoint }]
          );
        }
      } catch (error) {
        console.log('Error highlighting point:', error);
      }
    }
    
    // Cleanup function to unhover when component unmounts or hoveredWord changes
    return () => {
      try {
        const plotlyInstance = window && (window as any).Plotly;
        const plotDiv = document.querySelector('.js-plotly-plot');
        
        if (plotlyInstance && plotlyInstance.Fx && plotDiv) {
          plotlyInstance.Fx.unhover(plotDiv);
        }
      } catch (error) {
        console.log('Error unhighlighting point:', error);
      }
    };
  }, [hoveredWord, plotData]);

  // Update the visualized words section
  const renderVisualizedWords = () => {
    // Only show visualized words if there's an active model
    return activeModelIndex !== -1 && (
      <>
        <SubTitle isDarkMode={isDarkMode}>Visualized Words</SubTitle>
        <WordList isDarkMode={isDarkMode}>
          {highlightedWords.map(word => {
            // Default to unknown if POS isn't set
            const pos = wordPos.get(word) || 'unknown';
            
            return (
              <HoverableWordItem
                key={word}
                word={word}
                pos={pos}
                isDarkMode={isDarkMode}
                onRemove={() => removeWord(word)}
              />
            );
          })}
        </WordList>
      </>
    );
  };

  return (
    <AppContainer isDarkMode={isDarkMode}>
      {/* Loading Indicator - Shows during async operations */}
      {isLoading && (
        <LoadingOverlay isDarkMode={isDarkMode}>
          <LoadingBar isDarkMode={isDarkMode} />
        </LoadingOverlay>
      )}

      {/* Theme Toggle - Switches between light and dark mode */}
      <ThemeToggle 
        isDarkMode={isDarkMode} 
        onClick={() => setIsDarkMode(!isDarkMode)}
        title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {isDarkMode ? '◐' : '◑'}
      </ThemeToggle>

      {/* Left Panel - Application Controls */}
      <LeftPanel isDarkMode={isDarkMode}>
        {/* Application Title and Branding */}
        <TitleWrapper>
          <MainTitle isDarkMode={isDarkMode}>2D Dictionary</MainTitle>
          <SubTitleMain isDarkMode={isDarkMode}>Word Visualizer</SubTitleMain>
        </TitleWrapper>

        {/* File Upload Interface */}
        <FileInput isDarkMode={isDarkMode}>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
          />
        </FileInput>

        {/* Error Message Display */}
        {error && <ErrorMessage isDarkMode={isDarkMode}>{error}</ErrorMessage>}
        
        {/* Success Message Display */}
        {success && <SuccessMessage isDarkMode={isDarkMode}>{success}</SuccessMessage>}
        
        {/* Single Word Search Interface */}
        <SubTitle isDarkMode={isDarkMode}>Add Single Word</SubTitle>
        <Input
          type="text"
          placeholder={activeModelIndex === -1 ? "Select a model first" : "Enter a word to visualize"}
          value={searchWord}
          onChange={(e) => setSearchWord(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          isDarkMode={isDarkMode}
          disabled={activeModelIndex === -1}
        />
        <Button 
          onClick={handleSearch} 
          isDarkMode={isDarkMode}
          disabled={activeModelIndex === -1 || !searchWord.trim()}
        >
          Add Word
        </Button>

        {/* Paragraph Input Interface */}
        <SubTitle isDarkMode={isDarkMode}>Add Words from Paragraph</SubTitle>
        <TextArea
          placeholder={activeModelIndex === -1 ? "Select a model first" : "Enter a paragraph to extract important words"}
          value={paragraph}
          onChange={(e) => setParagraph(e.target.value)}
          isDarkMode={isDarkMode}
          disabled={activeModelIndex === -1}
        />
        <Button 
          onClick={handleParagraphSubmit} 
          isDarkMode={isDarkMode}
          disabled={activeModelIndex === -1 || !paragraph.trim()}
        >
          Extract and Visualize Words
        </Button>

        <Button 
          onClick={() => setHighlightedWords([])} 
          isDarkMode={isDarkMode}
          disabled={highlightedWords.length === 0}
        >
          Clear All Words
        </Button>

        {/* Color Legend - Shows part of speech color coding */}
        {highlightedWords.length > 0 && (
          <>
            <SubTitle isDarkMode={isDarkMode}>Color Coding</SubTitle>
            <WordList isDarkMode={isDarkMode}>
              <WordItem isDarkMode={isDarkMode}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '12px', height: '12px', backgroundColor: getPosColor('noun'), borderRadius: '50%' }}></div>
                  Nouns ({groupedEmbeddings.noun.length})
                </div>
              </WordItem>
              <WordItem isDarkMode={isDarkMode}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '12px', height: '12px', backgroundColor: getPosColor('verb'), borderRadius: '50%' }}></div>
                  Verbs ({groupedEmbeddings.verb.length})
                </div>
              </WordItem>
              <WordItem isDarkMode={isDarkMode}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '12px', height: '12px', backgroundColor: getPosColor('adjective'), borderRadius: '50%' }}></div>
                  Adjectives ({groupedEmbeddings.adjective.length})
                </div>
              </WordItem>
              <WordItem isDarkMode={isDarkMode}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '12px', height: '12px', backgroundColor: getPosColor('adverb'), borderRadius: '50%' }}></div>
                  Adverbs ({groupedEmbeddings.adverb.length})
                </div>
              </WordItem>
              <WordItem isDarkMode={isDarkMode}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '12px', height: '12px', backgroundColor: getPosColor('unknown'), borderRadius: '50%' }}></div>
                  Others/Unknown ({groupedEmbeddings.unknown.length})
                </div>
              </WordItem>
            </WordList>
          </>
        )}

        {/* Models List - Shows all loaded models */}
        {models.length > 0 && (
          <>
            <SubTitle isDarkMode={isDarkMode}>Loaded Models</SubTitle>
            <WordList isDarkMode={isDarkMode}>
              {models.map((model, index) => (
                <WordItem 
                  key={index} 
                  isDarkMode={isDarkMode}
                  style={{
                    backgroundColor: index === activeModelIndex 
                      ? (isDarkMode ? '#505050' : '#e0e0e0')
                      : undefined,
                    cursor: 'pointer'
                  }}
                  onClick={() => selectModel(index)}
                >
                  {model.name}
                  <RemoveButton
                    isDarkMode={isDarkMode}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeModel(index);
                    }}
                    title="Remove model"
                  >
                    ×
                  </RemoveButton>
                </WordItem>
              ))}
            </WordList>
          </>
        )}

        {/* Visualized Paragraphs Section */}
        {savedParagraphs.length > 0 && (
          <>
            <SubTitle isDarkMode={isDarkMode}>Visualized Paragraphs</SubTitle>
            <div>
              {savedParagraphs.map(para => {
                // Get first few words for preview
                const previewText = para.text.length > 30 
                  ? para.text.substring(0, 30) + '...' 
                  : para.text;
                
                const isActive = activeParagraphId === para.id;
                const isExpanded = expandedParagraphId === para.id;
                
                return (
                  <ParagraphItem 
                    key={para.id} 
                    isDarkMode={isDarkMode}
                    isActive={isActive}
                  >
                    <ParagraphHeader onClick={() => toggleActiveParagraph(para.id)}>
                      <div>
                        {isActive ? '► ' : '○ '}
                        {previewText}
                      </div>
                      <ParagraphActions>
                        <ExpandButton 
                          isDarkMode={isDarkMode}
                          title={isExpanded ? "Collapse" : "Expand"}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpandParagraph(para.id);
                          }}
                        >
                          {isExpanded ? '▲' : '▼'}
                        </ExpandButton>
                  <RemoveButton
                    isDarkMode={isDarkMode}
                          onClick={(e) => {
                            e.stopPropagation();
                            removeParagraph(para.id);
                          }}
                          title="Remove paragraph and its words"
                  >
                    ×
                  </RemoveButton>
                      </ParagraphActions>
                    </ParagraphHeader>
                    
                    {isExpanded && (
                      <ParagraphContent isDarkMode={isDarkMode}>
                        {para.text}
                      </ParagraphContent>
                    )}
                  </ParagraphItem>
                );
              })}
            </div>
          </>
        )}

        {/* Visualized Words List - Shows currently plotted words */}
        {renderVisualizedWords()}
      </LeftPanel>

      {/* Right Panel - Interactive Visualization */}
      <RightPanel isDarkMode={isDarkMode}>
        {/* Plotly.js Visualization Component */}
        <Plot
          ref={plotRef}
          data={plotData}
          layout={plotLayout}
          config={{ responsive: true }}
        />
        {/* Active Model Display */}
        {activeModelIndex !== -1 && (
          <ModelName isDarkMode={isDarkMode}>
            {models[activeModelIndex].name}
          </ModelName>
        )}
      </RightPanel>
    </AppContainer>
  );
}

export default App;