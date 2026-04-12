export interface BugReport {
    id: string;
    timestamp: number;
    title: string;
    description: string;
    technicalDetails: string;
}

let bugs: BugReport[] = [];
try {
    const stored = localStorage.getItem('beastify_bugs');
    if (stored) bugs = JSON.parse(stored);
} catch (e) {
    console.error("Could not load bugs from local storage");
}

type Listener = () => void;
const listeners: Set<Listener> = new Set();

export const bugTracker = {
    getBugs: () => bugs,
    addBug: (title: string, description: string, technicalDetails: string) => {
        const newBug: BugReport = {
            id: Date.now().toString() + Math.random().toString(36).substring(7),
            timestamp: Date.now(),
            title,
            description,
            technicalDetails
        };
        bugs = [newBug, ...bugs];
        try {
            localStorage.setItem('beastify_bugs', JSON.stringify(bugs));
        } catch (e) {
            console.error("Failed to save bugs", e);
        }
        listeners.forEach(l => l());
    },
    removeBug: (id: string) => {
        bugs = bugs.filter(b => b.id !== id);
        try {
            localStorage.setItem('beastify_bugs', JSON.stringify(bugs));
        } catch (e) {
            console.error("Failed to save bugs", e);
        }
        listeners.forEach(l => l());
    },
    clearAll: () => {
        bugs = [];
        try {
            localStorage.setItem('beastify_bugs', JSON.stringify(bugs));
        } catch (e) {
            console.error("Failed to save bugs", e);
        }
        listeners.forEach(l => l());
    },
    subscribe: (listener: Listener) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
    }
};

// Global error handlers to catch unexpected issues
if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
        // Ignore ResizeObserver errors which are often benign
        if (event.message.includes('ResizeObserver')) return;
        
        bugTracker.addBug(
            "خطأ مفاجئ في التطبيق",
            "التطبيق لقى شي مشكل فاش كان كيحاول ينفذ شي أمر. يقدر يكون بسبب شي تحديث ولا شي حاجة ما تليشارجاتش مزيان.",
            `${event.message} at ${event.filename}:${event.lineno}`
        );
    });

    window.addEventListener('unhandledrejection', (event) => {
        bugTracker.addBug(
            "مشكل في الاتصال أو معالجة البيانات",
            "التطبيق حاول يتصل بشي سيرفر (بحال الذكاء الاصطناعي) ولا يعالج شي بيانات ولكن العملية فشلات. تأكد من الكونيكسيون ديالك.",
            String(event.reason)
        );
    });
}
