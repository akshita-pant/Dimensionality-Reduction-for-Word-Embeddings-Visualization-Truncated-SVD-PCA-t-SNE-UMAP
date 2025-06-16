# Word Visualizer - Project Documentation

## Project Overview

Word Visualizer is an interactive web application designed to visualize word embeddings in 2D space, enabling users to explore semantic relationships between words through their spatial positioning. The application provides an intuitive interface for loading, visualizing, and analyzing different word embedding models.

## Project Purpose

The primary purpose of this project is to make word embeddings - which are typically high-dimensional vectors - accessible and interpretable through 2D visualizations. This allows users to:

1. Visually explore semantic relationships between words
2. Compare different word embedding models
3. Analyze word clusters and patterns
4. Study language structure through part-of-speech visualization
5. Extract and analyze important words from text passages

## Technical Stack

### Frontend Technologies
- **React**: For building the user interface components
- **TypeScript**: For type-safe JavaScript development
- **Emotion**: For styled components and theming
- **Plotly.js**: For interactive data visualization and plotting
- **PapaParse**: For CSV data parsing

### Build Tools
- **Vite**: For fast development and production builds
- **TypeScript**: For type checking and compilation

### Data Processing
- External word embedding models presented as pre-processed CSV files
- Dictionary API integration for word definitions

## Key Features

### Model Management
- Load and switch between different word embedding models
- Support for multiple dimensionality reduction techniques:
  - PCA (Principal Component Analysis)
  - t-SNE (t-Distributed Stochastic Neighbor Embedding)
  - TSVD (Truncated Singular Value Decomposition)
  - UMAP (Uniform Manifold Approximation and Projection)
- Support for different embedding algorithms:
  - Word2Vec
  - GloVe (Global Vectors for Word Representation)
  - FastText

### Visualization
- Interactive 2D scatter plot of word embeddings
- Pan, zoom, and select capabilities
- Automated axis scaling and adjustment
- Dark/light theme support for better viewing experience

### Word Analysis
- Search and highlight specific words
- Automatic word definition retrieval and display on hover
- Part-of-speech tagging with color coding:
  - Nouns (blue)
  - Verbs (red)
  - Adjectives (yellow)
  - Adverbs (green)
  - Unknown (gray)

### Paragraph Analysis
- Extract and visualize important words from text passages
- Save and load paragraphs for comparative analysis
- Highlight words from specific paragraphs in the visualization

## Data Structure

### Word Embedding Files
The project uses pre-processed CSV files that contain 2D projections of word embeddings:
- Each file follows the format: `x,y,word`
- Files are organized by dimensionality reduction technique and embedding model
- Example: `PCA_Word2Vec.csv`, `TSNE_GloVe.csv`, etc.

### Core Data Model
- **WordEmbedding**: Represents a single word with its coordinates and metadata
  - word: The lexical item
  - x: X-coordinate in 2D space
  - y: Y-coordinate in 2D space
  - pos: Part of speech (noun, verb, adjective, adverb, or unknown)

- **Model**: Collection of word embeddings representing a semantic space
  - name: Identifier for the model
  - embeddings: Map of words to their embeddings

## Implementation Details

### Visualization Process
1. CSV files containing pre-processed 2D word embeddings are loaded
2. Words are parsed and stored in an efficient data structure
3. User can search for words or extract them from paragraphs
4. Selected words are visualized on the plot with part-of-speech coloring
5. Word definitions are retrieved on demand
6. Interactive elements allow exploration of the semantic space

### External APIs
- Dictionary API for word definitions and part-of-speech information
  - Source: `https://api.dictionaryapi.dev/api/v2/entries/en/`

## Technical Challenges and Solutions

### Scalability
- **Challenge**: Handling large embedding datasets with thousands of words
- **Solution**: Efficient data structures and on-demand loading

### Performance
- **Challenge**: Maintaining smooth interaction with large visualizations
- **Solution**: Optimized rendering with Plotly.js and filtered data display

### Usability
- **Challenge**: Making complex embedding data accessible to users
- **Solution**: Intuitive UI with search, hover information, and color coding

## Project Structure

```
project-root/
├── csv_files/                # Pre-processed word embedding files
│   ├── PCA_FastText.csv      # PCA reduction of FastText embeddings
│   ├── PCA_Glove.csv         # PCA reduction of GloVe embeddings
│   ├── PCA_Word2Vec.csv      # PCA reduction of Word2Vec embeddings
│   ├── TSNE_FastText.csv     # t-SNE reduction of FastText embeddings
│   ├── TSNE_Glove.csv        # t-SNE reduction of GloVe embeddings
│   ├── TSNE_Word2Vec.csv     # t-SNE reduction of Word2Vec embeddings
│   ├── TSVD_FastText.csv     # TSVD reduction of FastText embeddings
│   ├── TSVD_Glove.csv        # TSVD reduction of GloVe embeddings
│   ├── TSVD_Word2Vec.csv     # TSVD reduction of Word2Vec embeddings
│   ├── UMAP_FastText.csv     # UMAP reduction of FastText embeddings
│   ├── UMAP_Glove.csv        # UMAP reduction of GloVe embeddings
│   └── UMAP_Word2Vec.csv     # UMAP reduction of Word2Vec embeddings
├── src/
│   ├── App.tsx               # Main application component
│   ├── main.tsx              # Application entry point
│   └── index.css             # Global styles
├── index.html                # HTML entry point
├── package.json              # Dependencies and scripts
└── vite.config.ts            # Build configuration
```

## Conclusion

The Word Visualizer project provides an accessible and intuitive way to explore the complex world of word embeddings through interactive visualizations. By making these abstract mathematical constructs visually tangible, the application bridges the gap between computational linguistics and human understanding, offering valuable insights into language structure and semantic relationships.
