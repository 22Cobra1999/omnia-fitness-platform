"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, Plus, Settings, Palette } from 'lucide-react'
import { WorkshopTopicScheduler } from '../calendar/workshop-topic-scheduler'
import { WorkshopSimpleScheduler } from '../calendar/workshop-simple-scheduler'

interface WorkshopTopic {
  id?: string
  topic_title: string
  topic_description: string
  topic_number: number
  color: string

  // Horario Original
  original_days: string[]
  original_start_time: string
  original_end_time: string

  // Horario BIS
  bis_enabled: boolean
  bis_days: string[]
  bis_start_time: string
  bis_end_time: string

  // Período
  start_date: string
  end_date: string
}

interface WorkshopSession {
  date: string
  startTime: string
  endTime: string
  duration: number
}

interface WorkshopTopicManagerProps {
  onTopicsChange: (topics: WorkshopTopic[]) => void
  onSessionsChange: (sessions: WorkshopSession[]) => void
  initialTopics?: WorkshopTopic[]
  initialSessions?: WorkshopSession[]
}

export function WorkshopTopicManager({
  onTopicsChange,
  onSessionsChange,
  initialTopics = [],
  initialSessions = []
}: WorkshopTopicManagerProps) {
  const [topics, setTopics] = useState<WorkshopTopic[]>(initialTopics)
  const [sessions, setSessions] = useState<WorkshopSession[]>(initialSessions)
  const [activeTab, setActiveTab] = useState("topics")
  const [editingTopic, setEditingTopic] = useState<WorkshopTopic | null>(null)

  const handleTopicAdd = (newTopic: WorkshopTopic) => {
    const topicWithId = {
      ...newTopic,
      id: editingTopic?.id || Date.now().toString(),
      topic_number: editingTopic?.topic_number || topics.length + 1
    }

    if (editingTopic) {
      // Editar tema existente
      const updatedTopics = topics.map(topic =>
        topic.id === editingTopic.id ? topicWithId : topic
      )
      setTopics(updatedTopics)
      onTopicsChange(updatedTopics)
    } else {
      // Agregar nuevo tema
      const updatedTopics = [...topics, topicWithId]
      setTopics(updatedTopics)
      onTopicsChange(updatedTopics)
    }

    setEditingTopic(null)
    setActiveTab("calendar")
  }

  const handleTopicEdit = (topic: WorkshopTopic) => {
    setEditingTopic(topic)
    setActiveTab("topics")
  }

  const handleTopicDelete = (topicId: string) => {
    const updatedTopics = topics.filter(topic => topic.id !== topicId)
    setTopics(updatedTopics)
    onTopicsChange(updatedTopics)
  }

  const handleSessionsUpdate = (newSessions: WorkshopSession[]) => {
    setSessions(newSessions)
    onSessionsChange(newSessions)
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

        {/* Tabs Navigation */}
        <TabsList className="grid w-full grid-cols-3 bg-[#1A1A1A] border-[#2A2A2A]">
          <TabsTrigger
            value="topics"
            className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
          >
            <Settings className="h-4 w-4 mr-2" />
            Temas ({topics.length})
          </TabsTrigger>
          <TabsTrigger
            value="calendar"
            className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Calendario ({sessions.length})
          </TabsTrigger>
          <TabsTrigger
            value="preview"
            className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
          >
            <Palette className="h-4 w-4 mr-2" />
            Vista Previa
          </TabsTrigger>
        </TabsList>

        {/* Tab: Configurar Temas */}
        <TabsContent value="topics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Formulario de Tema */}
            <div className="lg:col-span-2">
              <WorkshopTopicScheduler
                onTopicChange={handleTopicAdd}
                initialTopic={editingTopic || undefined}
              />
            </div>

            {/* Lista de Temas Creados */}
            <div className="space-y-3">
              <h3 className="text-white font-medium text-sm">Temas Creados</h3>

              {topics.length === 0 ? (
                <div className="text-gray-400 text-sm text-center py-8">
                  No hay temas creados
                </div>
              ) : (
                <div className="space-y-2">
                  {topics.map((topic, index) => (
                    <Card key={topic.id} className="bg-[#1A1A1A] border-[#2A2A2A]">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${topic.color}`} />
                            <div>
                              <h4 className="text-white text-sm font-medium">
                                {topic.topic_title || `Tema ${topic.topic_number}`}
                              </h4>
                              <p className="text-gray-400 text-xs">
                                {topic.original_days.length} días • {topic.original_start_time}-{topic.original_end_time}
                                {topic.bis_enabled && (
                                  <span className="ml-1 text-orange-400">+ BIS</span>
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleTopicEdit(topic)}
                              className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                            >
                              ✏️
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleTopicDelete(topic.id!)}
                              className="h-6 w-6 p-0 text-gray-400 hover:text-red-400"
                            >
                              🗑️
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Tab: Calendario de Sesiones */}
        <TabsContent value="calendar">
          <WorkshopSimpleScheduler
            sessions={sessions}
            onSessionsChange={handleSessionsUpdate}
          />
        </TabsContent>

        {/* Tab: Vista Previa */}
        <TabsContent value="preview">
          <Card className="bg-[#1A1A1A] border-[#2A2A2A]">
            <CardHeader>
              <CardTitle className="text-white text-lg">Vista Previa del Taller</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">

              {/* Resumen de Temas */}
              <div>
                <h3 className="text-white font-medium mb-3">Temas Configurados</h3>
                {topics.length === 0 ? (
                  <p className="text-gray-400 text-sm">No hay temas configurados</p>
                ) : (
                  <div className="space-y-2">
                    {topics.map((topic, index) => (
                      <div key={topic.id} className="flex items-center gap-3 p-3 bg-[#0A0A0A] rounded-lg">
                        <div className={`w-4 h-4 rounded-full ${topic.color}`} />
                        <div className="flex-1">
                          <h4 className="text-white font-medium">{topic.topic_title}</h4>
                          <p className="text-gray-400 text-sm">{topic.topic_description}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-xs text-gray-500">
                              Original: {topic.original_days.join(', ')} {topic.original_start_time}-{topic.original_end_time}
                            </span>
                            {topic.bis_enabled && (
                              <span className="text-xs text-orange-400">
                                BIS: {topic.bis_days.join(', ')} {topic.bis_start_time}-{topic.bis_end_time}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Resumen de Sesiones */}
              <div>
                <h3 className="text-white font-medium mb-3">Sesiones Programadas</h3>
                {sessions.length === 0 ? (
                  <p className="text-gray-400 text-sm">No hay sesiones programadas</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {sessions.map((session, index) => (
                      <div key={index} className="p-2 bg-[#0A0A0A] rounded text-sm">
                        <span className="text-white">
                          {new Date(session.date).toLocaleDateString('es-ES')}
                        </span>
                        <span className="text-gray-400 ml-2">
                          {session.startTime}-{session.endTime}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  )
}
