# Contributing to x402 Protocol Observatory

Thank you for your interest in contributing to the x402 Protocol Observatory! This document provides guidelines for contributing to this research platform.

## Code of Conduct

This project is dedicated to providing a welcoming and inclusive environment for all contributors. We expect all participants to:

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

## Ethical Guidelines

As a research and educational platform, all contributions must adhere to our ethical guidelines:

- **Research Focus**: Contributions should support legitimate research and educational purposes
- **Public Data Only**: Only work with publicly available blockchain data
- **Transparent Methods**: All analysis methods should be documented and reproducible
- **No Exploitation**: Do not add features designed to exploit or manipulate markets
- **Privacy Respect**: Do not collect or store private user information

## Getting Started

### Prerequisites

- Node.js 20.0+
- PostgreSQL 14+
- Git
- Familiarity with TypeScript, Next.js, and blockchain concepts

### Setup Development Environment

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/x402-Scanner.git
   cd x402-Scanner
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```
5. Set up the database:
   ```bash
   npx prisma generate
   npx prisma db push
   ```
6. Start development server:
   ```bash
   npm run dev
   ```

## How to Contribute

### Reporting Issues

- Check if the issue already exists
- Use the issue template if available
- Provide clear description and reproduction steps
- Include relevant logs and screenshots

### Suggesting Features

- Open an issue with the "enhancement" label
- Clearly describe the research or educational value
- Explain the proposed implementation approach
- Discuss how it aligns with the project's ethical guidelines

### Submitting Pull Requests

1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes:
   - Write clean, documented code
   - Follow the existing code style
   - Add tests for new features
   - Update documentation as needed

3. Test your changes:
   ```bash
   npm test
   npm run lint
   ```

4. Commit your changes:
   ```bash
   git commit -m "Add feature: your feature description"
   ```

5. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

6. Open a Pull Request:
   - Provide a clear description of changes
   - Reference any related issues
   - Explain the research or educational value
   - Include screenshots if relevant

## Development Guidelines

### Code Style

- Use TypeScript for type safety
- Follow ESLint configuration
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

### Testing

- Write unit tests for new functions
- Add integration tests for API endpoints
- Test with both Base and Solana networks
- Verify data accuracy and consistency

### Documentation

- Update README.md for significant changes
- Document new API endpoints
- Add inline code comments
- Update methodology documentation for new analysis methods

### Database Changes

- Create Prisma migrations for schema changes
- Test migrations on clean database
- Document data model changes
- Consider data retention policies

## Areas for Contribution

We welcome contributions in these areas:

### Data Collection
- Improved protocol detection algorithms
- Additional blockchain network support
- More efficient data collection methods
- Historical data synchronization

### Analysis & Visualization
- New statistical analysis methods
- Advanced visualization components
- Pattern recognition algorithms
- Comparative analysis tools

### Documentation
- Research methodology documentation
- API usage examples
- Educational tutorials
- Case studies and research papers

### Infrastructure
- Performance optimizations
- Caching improvements
- Database query optimization
- Testing infrastructure

### User Experience
- Dashboard improvements
- Data export formats
- Search and filtering capabilities
- Mobile responsiveness

## Review Process

1. Maintainers review all pull requests
2. Feedback provided within 5 business days
3. Changes may be requested for:
   - Code quality and style
   - Test coverage
   - Documentation
   - Ethical compliance

4. Approved PRs are merged by maintainers
5. Contributors are acknowledged in release notes

## Research Collaboration

For academic collaborations or research partnerships:

- Email: research@x402observatory.org
- Describe your research goals
- Explain data requirements
- Discuss collaboration opportunities

## Questions?

- Open a GitHub issue for technical questions
- Join our research forum for discussions
- Email us for private inquiries

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to blockchain research and education!
