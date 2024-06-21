// @ts-ignore
import styles from './sceneRoute.css?inline'

import React, { useEffect, useRef, useState } from 'react'

import { useLoadEngineWithScene, useNetwork } from '@etherealengine/client-core/src/components/World/EngineHooks'
import { useLoadScene } from '@etherealengine/client-core/src/components/World/LoadLocationScene'
import '@etherealengine/client-core/src/world/LocationModule'
import { Engine, Entity, getComponent, setComponent } from '@etherealengine/ecs'
import { GLTFAssetState } from '@etherealengine/engine/src/gltf/GLTFState'
import { useHookstate, useImmediateEffect, useMutableState } from '@etherealengine/hyperflux'
import { CameraComponent } from '@etherealengine/spatial/src/camera/components/CameraComponent'
import { CameraOrbitComponent } from '@etherealengine/spatial/src/camera/components/CameraOrbitComponent'
import { InputComponent } from '@etherealengine/spatial/src/input/components/InputComponent'
import { RendererComponent } from '@etherealengine/spatial/src/renderer/WebGLRendererSystem'
import { useEngineCanvas } from '@etherealengine/client-core/src/hooks/useEngineCanvas'
import { EngineState } from '@etherealengine/spatial/src/EngineState'

type Metadata = {
  name: string
  description: string
}

type SubRoute = Metadata & {
  props: {}
}

export type RouteData = Metadata & {
  entry: (...args: any[]) => any
  sub?: SubRoute[]
}

export const buttonStyle = {
  width: 'auto',
  height: '100%',
  fontSize: '1.5rem',
  fontWeight: 'bold',
  padding: '8px',
  margin: '10px',
  borderStyle: 'solid',
  background: '#969696',
  cursor: 'pointer',
  boxShadow: '2px 2px 5px rgba(0, 0, 0, 0.3)', // Adds a slight 3D effect with a box-shadow
  wordWrap: 'break-word',
  borderColor: 'rgba(31, 27, 72, 0.85)' // Sets the outline color to rgb(31, 27, 72, 0.85)
} as React.CSSProperties

const Header = (props: { header: string }) => {
  return (
    <div className="NavBarHeaderContainer">
      <h1 className="NavBarHeaderText">{props.header}</h1>
    </div>
  )
}

export const useRouteScene = (projectName = 'ee-development-test-suite', sceneName = 'public/scenes/Examples.gltf') => {
  useLoadScene({ projectName: projectName, sceneName: sceneName })
  useNetwork({ online: false })
  useLoadEngineWithScene()

  const gltfState = useMutableState(GLTFAssetState)
  const sceneEntity = useHookstate<undefined | Entity>(undefined)
  const viewerEntity = useMutableState(EngineState).viewerEntity.value

  useEffect(() => {
    const sceneURL = `projects/${projectName}/${sceneName}`
    if (!gltfState[sceneURL].value) return
    const entity = gltfState[sceneURL].value
    if (entity) sceneEntity.set(entity)
  }, [gltfState])

  useImmediateEffect(() => {
    if (!viewerEntity) return
    setComponent(viewerEntity, CameraOrbitComponent)
    setComponent(viewerEntity, InputComponent)
    getComponent(viewerEntity, CameraComponent).position.set(0, 0, 4)
  }, [viewerEntity])

  return sceneEntity
}

const routeKey = 'route'
const subRouteKey = 'subroute'

const Routes = (props: { routes: RouteData[]; header: string }) => {
  const { routes, header } = props
  const [currentRoute, setCurrentRoute] = useState(null as null | number)
  const [currentSubRoute, setCurrentSubRoute] = useState(0)

  const ref = useRef(null as null | HTMLDivElement)

  useEngineCanvas(ref)

  const onClick = (routeIndex: number) => {
    setCurrentRoute(routeIndex)
    setCurrentSubRoute(0)
  }

  const onSubClick = (subIndex: number) => {
    setCurrentSubRoute(subIndex)
  }

  useEffect(() => {
    const queryString = window.location.search
    const urlParams = new URLSearchParams(queryString)
    const routeIndexStr = urlParams.get(routeKey) as any
    if (routeIndexStr) {
      const routeIndex = Number(routeIndexStr)
      setCurrentRoute(routeIndex)
      const subIndexStr = urlParams.get(subRouteKey) as any
      if (subIndexStr) {
        const subIndex = Number(subIndexStr)
        setCurrentSubRoute(subIndex)
      }
    }
  }, [])

  useEffect(() => {
    if (currentRoute === null) return
    const url = new URL(window.location.href)
    url.searchParams.set(routeKey, currentRoute.toString())
    url.searchParams.set(subRouteKey, currentSubRoute.toString())
    window.history.pushState(null, '', url.toString())
  }, [currentRoute, currentSubRoute])

  const selectedRoute = currentRoute !== null ? routes[currentRoute] : null
  const selectedSub = selectedRoute && selectedRoute.sub && selectedRoute.sub[currentSubRoute]
  const Entry = selectedRoute && selectedRoute.entry
  const subProps = selectedSub ? selectedSub.props : {}

  return (
    <>
      <style type="text/css">{styles.toString()}</style>
      <div className="ScreenContainer" >
        <div className="NavBarContainer">
          <Header header={header} />
          <div className="NavBarSelectionContainer">
            {routes.map((route, index) => {
              const title = route.name
              const desc = route.description
              return (
                <React.Fragment key={title}>
                  <div
                    className={index === currentRoute ? 'SelectedItemContainer' : 'RouteItemContainer'}
                    onClick={() => onClick(index)}
                  >
                    <div className="RouteItemTitle">{title}</div>
                    <div className="RouteItemDescription">{desc}</div>
                  </div>
                  {index === currentRoute && routes[currentRoute]?.sub && (
                    <div className="SubItemsContainer">
                      {routes[currentRoute].sub?.map((sub, subIndex) => {
                        const subTitle = sub.name
                        const subDesc = sub.description
                        return (
                          <div
                            key={subTitle}
                            className={subIndex === currentSubRoute ? 'SelectedItemContainer' : 'RouteItemContainer'}
                            onClick={() => onSubClick(subIndex)}
                          >
                            <div className="RouteItemTitle">{subTitle}</div>
                            <div className="RouteItemDescription">{subDesc}</div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </div>
        <div id="examples-panel" ref={ref} style={{ flexGrow: 1, pointerEvents: 'none' }} />
      </div>
      {Entry && <Entry {...subProps} />}
    </>
  )
}

export default Routes
