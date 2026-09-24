# CampusCart — MongoDB Collection Design (Auth Module)

Unlike the old MySQL schema, MongoDB stores documents, not rows-with-
foreign-keys. This module only creates one collection so far — `users`
— generated automatically by Django/Djongo when you run migrations
(see accounts/models.py for the actual field definitions).

## `users` collection (one document per student/admin)

```json
{
  "_id": ObjectId("..."),
  "full_name": "Kapil Kapse",
  "email": "kapil@example.com",
  "password": "pbkdf2_sha256$...",   // hashed by Django, never plain text
  "college_id": "1272251110",
  "phone": "9999999999",
  "profile_image": null,
  "role": "STUDENT",                 // "STUDENT" or "ADMIN" — no separate roles collection
  "avg_rating": 0.0,
  "is_active": true,
  "is_staff": false,
  "created_at": "2026-08-24T10:00:00Z",
  "updated_at": "2026-08-24T10:00:00Z"
}
```

## Design decisions worth remembering for your report/viva

1. **No separate `roles` collection.** The old MySQL schema normalized
   roles into their own table with a foreign key, because relational
   databases reward avoiding repeated data. MongoDB rewards the opposite
   for small, fixed value sets like this — storing `role` directly on the
   user document avoids an unnecessary join/lookup for something that only
   ever has two possible values.

2. **`email` is unique and used as the login identifier** instead of a
   separate username field — enforced both at the Django model level
   (`unique=True`) and functionally, since `USERNAME_FIELD = 'email'`.

3. **Password is never stored as entered.** Django's `set_password()`
   hashes it (PBKDF2 by default, the same algorithm the old hand-written
   Java version used) before it ever reaches MongoDB.

## Looking ahead (not built yet)
When the Product Listings module is built next, expect `product_images`
to become an **embedded array field** directly inside each product
document, rather than a separate collection — that's the MongoDB-idiomatic
equivalent of the old `product_images` table with a foreign key back to
`products`.
