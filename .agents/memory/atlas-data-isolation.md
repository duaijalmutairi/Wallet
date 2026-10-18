---
name: Atlas data isolation
description: Why this product must remain separate from preexisting Atlas subscription records.
---

Preserve the unrelated legacy records in the supplied Atlas database; keep this new product's data isolated rather than migrating or deleting them.

**Why:** The first successful Atlas connection revealed preexisting subscription records with an incompatible shape, despite this being a new product build.

**How to apply:** Use product-specific collections for new entities and do not reinterpret older generic collections as this app's records without the user's explicit approval.

Do not automatically assign ownerless records to the first account after enabling login.

**Why:** The user clarified that the app is for everyone. First-login claiming could expose existing financial records to an unrelated user.

**How to apply:** Leave existing ownerless data intact but inaccessible to normal account queries; require explicit verified ownership before any future migration.
