# API документация

## Схема базы данных (Supabase PostgreSQL)

### `users`
Хранение профилей пользователей.
*   `id`: BIGINT (Primary Key, Telegram User ID)
*   `first_name`: TEXT
*   `username`: TEXT
*   `photo_url`: TEXT
*   `created_at`: TIMESTAMP

### `groups`
Группы, в которых пользователи ведут учет расходов.
*   `id`: UUID (Primary Key)
*   `name`: TEXT
*   `created_by`: BIGINT (FK -> `users.id`)
*   `created_at`: TIMESTAMP

### `group_members`
Принадлежность пользователей к группам.
*   `group_id`: UUID (Primary Key, FK -> `groups.id`)
*   `user_id`: BIGINT (Primary Key, FK -> `users.id`)
*   `joined_at`: TIMESTAMP

### `expenses`
Расход (чек).
*   `id`: UUID (Primary Key)
*   `group_id`: UUID (FK -> `groups.id`)
*   `payer_id`: BIGINT (FK -> `users.id`) — кто заплатил
*   `description`: TEXT
*   `amount`: DECIMAL(10, 2)
*   `created_at`: TIMESTAMP

### `splits`
Как распределяется конкретный расход (долги).
*   `id`: UUID (Primary Key)
*   `expense_id`: UUID (FK -> `expenses.id`)
*   `user_id`: BIGINT (FK -> `users.id`) — кому должен
*   `amount`: DECIMAL(10, 2) — сколько должен
*   `is_paid`: BOOLEAN (статус погашения)

### `comments`
Обсуждение конкретных расходов.
*   `id`: UUID (Primary Key)
*   `expense_id`: UUID (FK -> `expenses.id`)
*   `user_id`: BIGINT (FK -> `users.id`)
*   `text`: TEXT
*   `created_at`: TIMESTAMP

## Store API (Zustand)

### Actions

*   `fetchUserGroups(userId: number): Promise<Group[]>`
    *   Загружает список групп, в которых состоит пользователь.
    *   Обновляет срез `userGroups` в сторе.

*   `fetchGroupData(groupId: string): Promise<void>`
    *   Загружает полную информацию о группе: название (`currentGroup`), список участников (`members`), и список расходов (`expenses`) вместе со сплитами.
    *   Устанавливает `isLoading: true` при старте.

*   `addExpense(expense: Omit<Expense, ...>): Promise<void>`
    *   Принимает объект расхода и массив сплитов.
    *   Создает запись в `expenses`, получает её ID.
    *   Массово создает записи в `splits` с привязкой к expense ID.
    *   Обновляет данные группы (`fetchGroupData`).
    *   TODO: Оптимистичное обновление UI.

*   `fetchComments(expenseId: string): Promise<Comment[]>`
    *   Загружает комментарии к выбранному расходу.

*   `addComment(expenseId: string, text: string): Promise<void>`
    *   Добавляет комментарий к расходу от имени текущего авторизованного пользователя (`user.id`).

*   `setGroup(group: Group)`
    *   Устанавливает текущую активную группу в сторе.
    *   Используется при навигации (например, выбор группы из списка).

*   `setUser(user: User)`
    *   Сохраняет данные текущего пользователя после инициализации Telegram Web App.
