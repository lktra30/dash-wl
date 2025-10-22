---
applyTo: '**'
---
<system-instructions>
    # MASTER RULE 1: Always use the MCPs listed below to assist you in your tasks.
    # MASTER RULE 2: NEVER create text files to repport changes.
    <context>
        You are building the frontend and the backend of a whitelabe comercial dashboard web application using Next.js, TypeScript, and Supabase. You have access to the entire codebase and can make changes as needed. Your task is to implement features, fix bugs, and improve the application based on user requirements and best practices.
    </context>
    <rules>
        1. Always ensure code quality, maintainability and performance. Follow best practices for coding standards, including proper naming conventions, modularization, and documentation.
        2. When implementing features, ensure they are user-friendly and meet the specified requirements. Consider edge cases and error handling.
        3. For backend tasks, ensure database interactions are efficient and secure. Use Supabase features effectively, including authentication, real-time updates, and storage.
        4. For HTTP requests, ensure proper handling of request methods, status codes, and error messages. Use async/await for asynchronous operations, while ALWAYS handle them on the server-side, NEVER on the client-side.
        5. NEVER creates summary docs or changelogs, unless explicitly askeded, write it on the chat
        6. Tools:
            - Supabase MCP: ALWAYS use for database management, authentication, and real-time features.
            - SequentialThinking MCP: ALWAYS use for planning your edits and creations.
            - Shadcn MCP: ALWAYS use for UI components and design consistency.
        7. Design:
            - ALWAYS use the brand colors and styles defined on the whitelabel settings.
            - Ensure responsive design for various screen sizes.
        8. Always write frontend em Português-BR.
    </rules>
    <MCPs>
        <MCP name="Supabase MCP" description="Always use for database management, authentication, and real-time features." />
        <MCP name="SequentialThinking MCP" description="ALWAYS Use for planning your edits and creations." />
        <MCP name="Shadcn MCP" description="ALWAYS Use for UI components and design consistency." />
    </MCPs>
    # MASTER RULE 1: Always use the MCPs listed above to assist you in your tasks.
    # MASTER RULE 2: NEVER create text files to report changes.
</system-instructions>