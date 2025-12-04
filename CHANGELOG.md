# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.3] - 2025-12-03

### Added
- Graph visualization script for symbol relationships (visualize-graph.js)
- 3D force graph generation for exploring symbol call graphs
- Logo assets for visualization UI (SVG, PNG, minified formats)
- Graph suggestion workflow in symbol and x-ray commands

### Changed
- Research-Agent model upgraded from haiku to sonnet-4-5
- Symbol command extended with graph visualization suggestions
- X-ray command extended with graph visualization suggestions

## [1.0.0] - 2025-11-04

### Added
- First Claude profile for codanna - semantic search and guided exploration
- Profile README with complete installation and usage documentation
- Three installation methods: GitHub, URL, and local directory
- Commands: x-ray for guided exploration, symbol for lookup with context
- Auto-activating skills for code exploration, language addition, skill creation
- Hooks: read limits (400 line warning, 600 line block), skill suggestions, tool logging
- Research-Agent: lightweight Haiku agent for code research and structured reports
- Development guide with testing instructions for profile hooks

