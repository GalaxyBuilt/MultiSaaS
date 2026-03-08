# Contributing to MultiSaaS

First off, thank you for considering contributing to MultiSaaS! It's people like you who make this a great tool for the founder community.

## 🌈 How Can I Contribute?

### Adding New Integrations
The most valuable contribution is adding new "Adapters" for SaaS tools.
- **Payment Providers**: Adyen, LemonSqueezy, etc.
- **Banking**: Mercury, Brex, Wise.
- **Analytics**: Google Analytics, PostHog, Mixpanel.

Check `frontend/src/lib/integrations/` for placeholder patterns.

### Improving the Dashboard
- Adding new chart types using Recharts.
- Enhancing the AI Insight generator (logic or UI).
- Improving mobile responsiveness.

### Bug Reports & Feature Requests
Please use GitHub Issues to report bugs or suggest new features. Using a clear title and description helps us address them faster.

## 💻 Local Development

1.  **Fork and Clone**: Fork the repository and clone it to your local machine.
2.  **Frontend**:
    ```bash
    cd frontend
    npm install
    npm run dev
    ```
3.  **Backend (Optional)**:
    ```bash
    cd backend
    npm install
    # Set up DATABASE_URL in .env
    npx prisma migrate dev
    npm run dev
    ```

## 📝 Coding Standards

- **TypeScript**: Always use types. Avoid `any` whenever possible.
- **Styling**: Use TailwindCSS and follow the existing design system tokens in `globals.css`.
- **Components**: Keep components modular and reusable. If a component is used in multiple places, move it to `@/components/ui`.
- **Commits**: Use descriptive commit messages (e.g., `feat: add stripe subscription sync`, `fix: dashboard mobile padding`).

## 🚀 Submitting a Pull Request

1.  Keep your PR focused. If you have several unrelated changes, please split them into multiple PRs.
2.  Provide a clear description of the changes and how to test them.
3.  Ensure your code passes the build (`npm run build`).

---

We can't wait to see what you build! 🚀
