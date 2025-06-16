# Sample Word Embedding CSV Files

This directory contains sample CSV files with pre-processed word embeddings in 2D space. These files can be used to quickly test and demonstrate the Word Visualizer application.

## Available Embedding Files

Each file contains the same vocabulary but uses a different dimensionality reduction technique to project the original high-dimensional GloVe word embeddings into 2D space:

| Filename | Technique | Description |
|----------|-----------|-------------|
| UMAP_Glove.csv | UMAP | Uniform Manifold Approximation and Projection - Better preserves local relationships between words |
| PCA_Glove.csv | PCA | Principal Component Analysis - Linear technique that maximizes variance |
| TNSE_Glove.csv | t-SNE | t-Distributed Stochastic Neighbor Embedding - Good for visualizing clusters |
| TSVD_Glove.csv | TSVD | Truncated Singular Value Decomposition - Efficient linear technique |

## File Format

Each CSV file follows this structure:
```
x-coordinate,y-coordinate,word
-0.123,0.456,apple
0.789,-0.321,orange
...
```

## Data Source

These samples were created using the following process:
1. Starting with GloVe word embeddings (300 dimensions) from the Stanford NLP Group
2. Applying dimensionality reduction to create 2D projections
3. Saving the resulting coordinates with the corresponding words

## Usage

To use these sample files in the Word Visualizer:
1. Launch the application
2. Click "Choose CSV File" in the left panel
3. Select any of the files from this directory
4. Begin exploring the word embeddings

## Performance Note

These files contain thousands of words, which might affect performance on less powerful devices. If you experience slowness, consider creating smaller samples or filtering the data to include only specific word categories. 