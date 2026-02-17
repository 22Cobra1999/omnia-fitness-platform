import React from 'react'
import { motion } from "framer-motion"
import { Folder, PlusCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FolderData } from '../constants/mock-data'

interface SaveVideoDialogProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    fitnessFolders: FolderData[]
    nutritionFolders: FolderData[]
    selectedFolder: string
    newFolderName: string
    newFolderCategory: "fitness" | "nutrition" | null
    onFolderSelection: (value: string) => void
    onAddNewFolder: (category: "fitness" | "nutrition") => void
    onFolderNameChange: (value: string) => void
    onSave: () => void
}

export function SaveVideoDialog({
    isOpen,
    onOpenChange,
    fitnessFolders,
    nutritionFolders,
    selectedFolder,
    newFolderName,
    newFolderCategory,
    onFolderSelection,
    onAddNewFolder,
    onFolderNameChange,
    onSave
}: SaveVideoDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[#1E1E1E] text-white max-h-[80vh] overflow-y-auto p-0 border-zinc-800">
                <DialogHeader className="p-6 bg-[#2A2A2A]">
                    <DialogTitle className="text-2xl font-bold text-[#FF7939]">Save Video</DialogTitle>
                </DialogHeader>
                <div className="p-6">
                    <Tabs defaultValue="fitness" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-6">
                            <TabsTrigger value="fitness" className="text-lg font-semibold">
                                Fitness
                            </TabsTrigger>
                            <TabsTrigger value="nutrition" className="text-lg font-semibold">
                                Nutrition
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="fitness">
                            <FolderList
                                folders={fitnessFolders}
                                onSelectFolder={onFolderSelection}
                                onAddNewFolder={() => onAddNewFolder("fitness")}
                                selectedFolder={selectedFolder}
                            />
                        </TabsContent>
                        <TabsContent value="nutrition">
                            <FolderList
                                folders={nutritionFolders}
                                onSelectFolder={onFolderSelection}
                                onAddNewFolder={() => onAddNewFolder("nutrition")}
                                selectedFolder={selectedFolder}
                            />
                        </TabsContent>
                    </Tabs>
                    {selectedFolder === "new_folder" && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="mt-6"
                        >
                            <label htmlFor="new-folder-name" className="block text-sm font-medium text-gray-300 mb-2">
                                New {newFolderCategory?.charAt(0).toUpperCase() + newFolderCategory?.slice(1)} Folder Name
                            </label>
                            <Input
                                id="new-folder-name"
                                value={newFolderName}
                                onChange={(e) => onFolderNameChange(e.target.value)}
                                placeholder={`Enter new ${newFolderCategory} folder name`}
                                className="w-full bg-zinc-900 border-zinc-700"
                            />
                        </motion.div>
                    )}
                </div>
                <DialogFooter className="p-6 bg-[#2A2A2A]">
                    <Button
                        onClick={onSave}
                        className="w-full bg-[#FF7939] hover:bg-[#E66829] text-white transition-colors duration-200 text-lg py-6"
                        disabled={selectedFolder === "new_folder" && !newFolderName.trim()}
                    >
                        Save Video
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function FolderList({
    folders,
    onSelectFolder,
    onAddNewFolder,
    selectedFolder,
}: {
    folders: FolderData[]
    onSelectFolder: (folderId: string) => void
    onAddNewFolder: () => void
    selectedFolder: string
}) {
    return (
        <div className="space-y-4">
            {folders.map((folder) => (
                <motion.div
                    key={folder.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <Button
                        variant="outline"
                        className={`w-full justify-start text-left h-auto py-4 px-6 border-zinc-700 ${selectedFolder === folder.id ? "bg-[#FF7939] text-white border-[#FF7939] hover:bg-[#E66829]" : "bg-transparent text-white hover:bg-white/5"
                            }`}
                        onClick={() => onSelectFolder(folder.id)}
                    >
                        <Folder className={`mr-4 h-6 w-6 ${selectedFolder === folder.id ? "text-white" : "text-[#FF7939]"}`} />
                        <span className="text-lg">{folder.title}</span>
                    </Button>
                </motion.div>
            ))}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
            >
                <Button
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-4 px-6 bg-transparent border-dashed border-zinc-700 text-white hover:bg-white/5"
                    onClick={onAddNewFolder}
                >
                    <PlusCircle className="mr-4 h-6 w-6 text-[#FF7939]" />
                    <span className="text-lg">Add New Folder</span>
                </Button>
            </motion.div>
        </div>
    )
}
