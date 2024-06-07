import Sidebar from "./components/Sidebar"
import Editor from "./components/Editor"
import Split from "react-split"
import React, {
    useEffect,
    useState 
} from "react"
import { 
    onSnapshot, 
    addDoc, 
    deleteDoc, 
    doc, 
    updateDoc, 
    orderBy, 
    query 
} from "firebase/firestore"
import { 
    notesCollection, 
    db 
} from "./firebase"

export default function App() {
    const [notes, setNotes] = React.useState([])
    const [currentNoteId, setCurrentNoteId] = React.useState("")
    const [tempNoteText, setTempNoteText] = useState('');
    
    const currentNote = 
        notes.find(note => note.id === currentNoteId) 
        || notes[0]

    React.useEffect(() => {
        const notesCollectionOrderedByDate = query(notesCollection, orderBy('updatedAt', 'desc'))
        const unsubscribe = onSnapshot(notesCollectionOrderedByDate, (snapshot) => {
            const noteArr = snapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id
            }))
            setNotes(noteArr);
        })
        return unsubscribe
    }, [])

    React.useEffect(() => {
        if (!currentNoteId) {
            setCurrentNoteId(notes[0]?.id)
        }
    }, [notes])

    useEffect(() => {
        if (currentNote) {
            setTempNoteText(currentNote.body)
        }
    }, [currentNote])

    useEffect(() => {
        const timeoutID = setTimeout(() => {
            // otherwise just clicking on a note will update it and push it to the top
            if (tempNoteText !== currentNote.body) {
                updateNote(tempNoteText);
            }
        }, 500)
        return () => clearTimeout(timeoutID);
    }, [tempNoteText])

    async function updateNote(text) {
        const docRef = doc(db, 'notes', currentNoteId)
        await updateDoc(docRef, { body: text, updatedAt: Date.now() }, { merge: true })
    }

    async function createNewNote() {
        const newNote = {
            body: "# Type your markdown note's title here",
            createdAt: Date.now(),
            updatedAt: Date.now()
        }
        const newNoteRef = await addDoc(notesCollection, newNote);
        setCurrentNoteId(newNoteRef.id)
    }

    async function deleteNote(noteId) {
        const docRef = doc(db, 'notes', noteId);
        await deleteDoc(docRef);
    }

    return (
        <main>
            {
                notes.length > 0
                    ?
                    <Split
                        sizes={[30, 70]}
                        direction="horizontal"
                        className="split"
                    >
                        <Sidebar
                            notes={notes}
                            currentNote={currentNote}
                            setCurrentNoteId={setCurrentNoteId}
                            newNote={createNewNote}
                            deleteNote={deleteNote}
                        />
                        <Editor
                            tempNoteText={tempNoteText}
                            setTempNoteText={setTempNoteText}
                        />
                    </Split>
                    :
                    <div className="no-notes">
                        <h1>You have no notes</h1>
                        <button
                            className="first-note"
                            onClick={createNewNote}
                        >
                            Create one now
                        </button>
                    </div>
            }
        </main>
    )
}