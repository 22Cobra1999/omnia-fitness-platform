"use client"

import React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCommunityFeedLogic } from "./hooks/useCommunityFeedLogic"
import { PostContentRenderer } from "./components/PostContentRenderer"
import { SaveVideoDialog } from "./components/SaveVideoDialog"

export function Feed() {
  const {
    activeTab,
    handleTabChange,
    filteredPosts,
    fitnessFolders,
    nutritionFolders,
    isSaveDialogOpen,
    setIsSaveDialogOpen,
    setSelectedPost,
    selectedFolder,
    newFolderName,
    setNewFolderName,
    newFolderCategory,
    setNewFolderCategory,
    handleFolderSelection,
    saveVideoToFolder
  } = useCommunityFeedLogic()

  return (
    <div className="max-w-4xl mx-auto">
      <Tabs
        value={activeTab}
        className="flex flex-col items-center"
        onValueChange={handleTabChange}
      >
        <TabsList className="font-mitr border-b border-gray-700 mb-8 text-lg bg-transparent">
          <TabsTrigger
            value="foryou"
            className="text-gray-400 data-[state=active]:text-white data-[state=active]:bg-[#FF7939] data-[state=active]:rounded-md px-6 py-3 transition-all duration-300 transform hover:scale-105 focus:outline-none"
          >
            For You
          </TabsTrigger>
          <TabsTrigger
            value="following"
            className="text-gray-400 data-[state=active]:text-white data-[state=active]:bg-[#FF7939] data-[state=active]:rounded-md px-6 py-3 transition-all duration-300 transform hover:scale-105 focus:outline-none"
          >
            Following
          </TabsTrigger>
        </TabsList>

        <TabsContent value="foryou" className="w-full">
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <PostContentRenderer
                key={post.id}
                post={post}
                setSelectedPost={setSelectedPost}
                setIsSaveDialogOpen={setIsSaveDialogOpen}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="following" className="w-full">
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <PostContentRenderer
                key={post.id}
                post={post}
                setSelectedPost={setSelectedPost}
                setIsSaveDialogOpen={setIsSaveDialogOpen}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <SaveVideoDialog
        isOpen={isSaveDialogOpen}
        onOpenChange={setIsSaveDialogOpen}
        fitnessFolders={fitnessFolders}
        nutritionFolders={nutritionFolders}
        selectedFolder={selectedFolder}
        newFolderName={newFolderName}
        newFolderCategory={newFolderCategory}
        onFolderSelection={handleFolderSelection}
        onAddNewFolder={(category) => {
          setSelectedFolder("new_folder")
          setNewFolderCategory(category)
          setNewFolderName("")
        }}
        onFolderNameChange={setNewFolderName}
        onSave={saveVideoToFolder}
      />
    </div>
  )
}
